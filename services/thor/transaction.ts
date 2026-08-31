import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { BlockId, Revision } from '@vechain/sdk-core'
import z from 'zod'
import {
  decodeCustomError,
  decodePanic,
  decodeStringRevert,
  getSelector,
  SELECTOR_ERROR_STRING,
  SELECTOR_PANIC,
  signatureToFunctionItem,
} from '@/lib/abi-registry'
import type { NetworkName } from '@/lib/constants/network'
import { getAllBundledAbis } from '@/lib/known-contracts'
import {
  type AddressString,
  type HexString,
  type Transaction,
  type TransactionId,
  transactionReceiptSchema,
  transactionSchema,
} from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getPossibleSelectorMismatch, type PossibleSelectorMismatch } from '@/lib/transaction-failure-insights'
import { zodParse } from '@/lib/utils/zod'
import { getDecodedSelector } from '@/services/selector-decoder'
import { getResolvedAbi } from '@/services/sourcify'
import { getThorClient } from './client'

const TRANSACTION_QUERY_KEY = 'getTransaction'
const TRANSACTION_RECEIPT_QUERY_KEY = 'getTransactionReceipt'
const LEGACY_BASE_GAS_PRICE_QUERY_KEY = 'getLegacyBaseGasPrice'
const TRANSACTION_FAILURE_INSIGHT_QUERY_KEY = 'getTransactionFailureInsight'

type RevertKind = 'string' | 'panic' | 'custom' | 'vm-error' | 'raw' | 'none'

type TransactionFailureInsight = {
  revertReason: string | null
  revertKind: RevertKind
  // Populated when revertKind is 'custom' or 'panic' so the UI can render
  // arg breakdowns. String / vm-error / raw use just `revertReason`.
  decoded?:
    | { kind: 'panic'; code: HexString; description: string }
    | {
        kind: 'custom'
        name: string
        signature: string
        args: readonly unknown[]
      }
  possibleSelectorMismatch: PossibleSelectorMismatch | null
}

export const transactionQueryOptions = (networkName: NetworkName, transactionId: TransactionId | undefined) =>
  queryOptions({
    queryKey: [TRANSACTION_QUERY_KEY, networkName, transactionId],
    queryFn: transactionId ? () => getTransaction({ networkName, transactionId }) : skipToken,
    staleTime: Infinity,
  })

export const getTransaction = async ({
  networkName,
  transactionId,
}: {
  networkName: NetworkName
  transactionId: TransactionId
}) => {
  const thorClient = getThorClient(networkName)
  const tx = await thorClient.transactions.getTransaction(transactionId)

  if (!tx) return null

  return zodParse({
    data: tx,
    schema: transactionSchema,
    errorMessage: 'Failed to parse Thor transaction',
  })
}

/**
 * Transaction receipt
 */
const transactionReceiptQueryOptions = (networkName: NetworkName, transactionId: TransactionId | undefined) =>
  queryOptions({
    queryKey: [TRANSACTION_RECEIPT_QUERY_KEY, networkName, transactionId],
    queryFn: transactionId ? () => getTransactionReceipt({ networkName, transactionId }) : skipToken,
    refetchInterval: query => (query.state.data === null ? false : 3000),
  })

const getTransactionReceipt = async ({
  networkName,
  transactionId,
}: {
  networkName: NetworkName
  transactionId: TransactionId
}) => {
  const thorClient = getThorClient(networkName)
  const receipt = await thorClient.transactions.getTransactionReceipt(transactionId)

  if (!receipt) return null

  return zodParse({
    data: receipt,
    schema: transactionReceiptSchema,
    errorMessage: 'Failed to parse Thor transaction receipt',
  })
}

const legacyBaseFeePerGasQueryOptions = (networkName: NetworkName) =>
  queryOptions({
    queryKey: [LEGACY_BASE_GAS_PRICE_QUERY_KEY, networkName],
    queryFn: () => getLegacyBaseGasPrice({ networkName }),
  })

const getLegacyBaseGasPrice = async ({ networkName }: { networkName: NetworkName }) => {
  const thorClient = getThorClient(networkName)
  const legacyBaseGasPrice = await thorClient.transactions.getLegacyBaseGasPrice()

  if (!legacyBaseGasPrice.success) return null

  return zodParse({
    data: legacyBaseGasPrice.result.plain,
    schema: z.coerce.bigint(),
    errorMessage: 'Failed to parse legacy base gas price',
  })
}

const formatArgs = (args: readonly unknown[]): string => {
  return args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(', ')
}

const decodeRevertPayload = async (
  networkName: NetworkName,
  target: AddressString | null,
  data: HexString,
): Promise<
  | { revertKind: 'string'; revertReason: string }
  | {
      revertKind: 'panic'
      revertReason: string
      decoded: { kind: 'panic'; code: HexString; description: string }
    }
  | {
      revertKind: 'custom'
      revertReason: string
      decoded: { kind: 'custom'; name: string; signature: string; args: readonly unknown[] }
    }
  | null
> => {
  const selector = getSelector(data)
  if (!selector) return null

  if (selector.toLowerCase() === SELECTOR_ERROR_STRING) {
    const decoded = decodeStringRevert(data)
    if (decoded) return { revertKind: 'string', revertReason: decoded.message }
  }

  if (selector.toLowerCase() === SELECTOR_PANIC) {
    const decoded = decodePanic(data)
    if (decoded) {
      return {
        revertKind: 'panic',
        revertReason: `Panic(${decoded.code}): ${decoded.description}`,
        decoded,
      }
    }
  }

  // Custom error — try the target's resolved ABI first, then sweep every
  // bundled ABI (reverts often surface from a contract called internally,
  // not the clause's target), then OpenChain as a last resort.
  if (target) {
    const resolved = await getResolvedAbi(networkName, target).catch(() => null)
    if (resolved?.abi) {
      const decoded = decodeCustomError(resolved.abi, data)
      if (decoded) {
        const reason = decoded.args.length > 0 ? `${decoded.name}(${formatArgs(decoded.args)})` : `${decoded.name}()`
        return {
          revertKind: 'custom',
          revertReason: reason,
          decoded: {
            kind: 'custom',
            name: decoded.name,
            signature: decoded.signature,
            args: decoded.args,
          },
        }
      }
    }
  }

  for (const abi of getAllBundledAbis()) {
    const decoded = decodeCustomError(abi, data)
    if (decoded) {
      const reason = decoded.args.length > 0 ? `${decoded.name}(${formatArgs(decoded.args)})` : `${decoded.name}()`
      return {
        revertKind: 'custom',
        revertReason: reason,
        decoded: {
          kind: 'custom',
          name: decoded.name,
          signature: decoded.signature,
          args: decoded.args,
        },
      }
    }
  }

  // Selector decoder fallback. Custom errors share the function-selector
  // encoding scheme, so we can re-use the function-signature lookup. The
  // service falls through b32 → OpenChain server-side; here we just take
  // whichever ABI fragment it returns.
  // Degraded rather than failed: a raw revert reason beats no insight at all.
  const selectorResult = await getDecodedSelector('function', selector).catch(() => null)
  if (selectorResult) {
    const synthetic =
      selectorResult.source === 'b32' ? selectorResult.abi : signatureToFunctionItem(selectorResult.signature)
    if (synthetic && synthetic.type === 'function' && synthetic.name) {
      const decoded = decodeCustomError(
        [
          {
            type: 'error',
            name: synthetic.name,
            inputs: synthetic.inputs,
          },
        ],
        data,
      )
      if (decoded) {
        const reason = decoded.args.length > 0 ? `${decoded.name}(${formatArgs(decoded.args)})` : `${decoded.name}()`
        return {
          revertKind: 'custom',
          revertReason: reason,
          decoded: {
            kind: 'custom',
            name: decoded.name,
            signature: decoded.signature,
            args: decoded.args,
          },
        }
      }
    }
  }

  return null
}

/**
 * Revert reason - simulates the transaction to get the revert reason
 */
const transactionFailureInsightQueryOptions = (
  networkName: NetworkName,
  transaction: Transaction | null | undefined,
  isReverted: boolean,
) =>
  queryOptions({
    queryKey: [TRANSACTION_FAILURE_INSIGHT_QUERY_KEY, networkName, transaction?.id],
    queryFn: transaction && isReverted ? () => getTransactionFailureInsight({ networkName, transaction }) : skipToken,
    staleTime: Infinity,
  })

// Shape returned by /debug/tracers with the 'call' tracer.
// (Re-declared loosely because the SDK's TraceReturnType is a heavy
// generic union; we only care about a small subset of fields.)
type CallTraceFrame = {
  type?: string
  from?: string
  to?: string
  input?: string
  output?: string
  error?: string
  calls?: CallTraceFrame[]
}

/** Deepest frame in the call tree that carries an error string. */
const findDeepestErrorFrame = (frame: CallTraceFrame): CallTraceFrame | null => {
  if (!frame.error) return null
  let deepest: CallTraceFrame = frame
  for (const sub of frame.calls ?? []) {
    const subDeepest = findDeepestErrorFrame(sub)
    if (subDeepest) deepest = subDeepest
  }
  return deepest
}

/**
 * Replay the failing clause via /debug/tracers and pull the most specific
 * revert info we can — preferred over simulating because the node executes
 * against the actual on-chain state at the failing block. Returns null if
 * the tracer endpoint isn't available (e.g. some solo nodes) or the tx
 * didn't actually revert in the trace.
 */
const decodeRevertViaTracer = async (
  networkName: NetworkName,
  transaction: Transaction,
): Promise<{
  revertedClauseIndex: number
  revertData: HexString | null
  vmError: string | null
} | null> => {
  const thorClient = getThorClient(networkName)
  for (let clauseIndex = 0; clauseIndex < transaction.clauses.length; clauseIndex++) {
    let frame: CallTraceFrame
    try {
      frame = (await thorClient.debug.traceTransactionClause(
        {
          target: {
            blockId: BlockId.of(transaction.meta.blockID),
            transaction: BlockId.of(transaction.id),
            clauseIndex,
          },
        },
        'call',
      )) as CallTraceFrame
    } catch {
      return null
    }
    if (!frame?.error) continue
    const deepest = findDeepestErrorFrame(frame) ?? frame
    const output = (deepest.output && deepest.output !== '0x' ? deepest.output : null) as HexString | null
    // "execution reverted" alone is too generic — only surface vmError when
    // the EVM raised something specific (out of gas, invalid opcode, …).
    const vmError = deepest.error && deepest.error !== 'execution reverted' ? deepest.error : null
    return { revertedClauseIndex: clauseIndex, revertData: output, vmError }
  }
  return null
}

const getTransactionFailureInsight = async ({
  networkName,
  transaction,
}: {
  networkName: NetworkName
  transaction: Transaction
}): Promise<TransactionFailureInsight> => {
  const thorClient = getThorClient(networkName)
  const clauses = transaction.clauses.map(clause => ({
    to: clause.to ?? null,
    value: clause.value.toString(),
    data: clause.data,
  }))

  const simulations = await thorClient.transactions.simulateTransaction(clauses, {
    revision: Revision.of(transaction.meta.blockID),
    caller: transaction.origin,
    gas: Number(transaction.gas),
  })

  const possibleSelectorMismatch = getPossibleSelectorMismatch({
    transaction,
    simulations,
  })

  // 1. Prefer /debug/tracers — it replays the actual on-chain execution at
  // the failing block, so it captures reverts that a fresh simulation
  // can't reproduce (timestamp-gated `distribute()`, randomness,
  // out-of-gas inside an internal call, …).
  const traced = await decodeRevertViaTracer(networkName, transaction)
  if (traced) {
    if (traced.revertData) {
      const target = transaction.clauses[traced.revertedClauseIndex]?.to ?? null
      const decoded = await decodeRevertPayload(
        networkName,
        target ? (target.toLowerCase() as AddressString) : null,
        traced.revertData,
      )
      if (decoded) {
        return { ...decoded, possibleSelectorMismatch }
      }
      const sdkDecoded = thorClient.transactions.decodeRevertReason(traced.revertData)
      if (sdkDecoded) {
        return { revertReason: sdkDecoded, revertKind: 'string', possibleSelectorMismatch }
      }
    }
    if (traced.vmError) {
      return { revertReason: traced.vmError, revertKind: 'vm-error', possibleSelectorMismatch }
    }
  }

  // 2. Fall back to the post-block simulation. This works for reverts that
  // are deterministic w.r.t. state (typical Error / Panic / custom error).
  for (let i = 0; i < simulations.length; i++) {
    const simulation = simulations[i]
    if (!simulation.reverted) continue

    if (simulation.data && simulation.data !== '0x') {
      const data = simulation.data as HexString
      const target = transaction.clauses[i]?.to ?? null

      const decoded = await decodeRevertPayload(
        networkName,
        target ? (target.toLowerCase() as AddressString) : null,
        data,
      )
      if (decoded) {
        return {
          ...decoded,
          possibleSelectorMismatch,
        }
      }

      const sdkDecoded = thorClient.transactions.decodeRevertReason(data)
      if (sdkDecoded) {
        return {
          revertReason: sdkDecoded,
          revertKind: 'string',
          possibleSelectorMismatch,
        }
      }

      return {
        revertReason: data,
        revertKind: 'raw',
        possibleSelectorMismatch,
      }
    }

    if (simulation.vmError) {
      return {
        revertReason: simulation.vmError,
        revertKind: 'vm-error',
        possibleSelectorMismatch,
      }
    }
  }

  // 3. Tracer + simulation both came up empty but the receipt says it
  // reverted (caller-promised). Surface a generic message so the alert
  // doesn't disappear silently.
  return {
    revertReason: 'execution reverted',
    revertKind: 'vm-error',
    possibleSelectorMismatch,
  }
}

export const useTransactionReceipt = (transactionId: TransactionId | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(transactionReceiptQueryOptions(networkName ?? activeNetworkName, transactionId))
}

export const useTransactionFailureInsight = (
  transaction: Transaction | null | undefined,
  isReverted: boolean,
  networkName?: NetworkName,
) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(transactionFailureInsightQueryOptions(networkName ?? activeNetworkName, transaction, isReverted))
}

export const useLegacyBaseFeePerGas = (networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(legacyBaseFeePerGasQueryOptions(networkName ?? activeNetworkName))
}
