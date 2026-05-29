import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { Revision } from '@vechain/sdk-core'
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
import { getOpenChainSignature } from '@/services/openchain'
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
export const transactionReceiptQueryOptions = (networkName: NetworkName, transactionId: TransactionId | undefined) =>
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

  // Custom error — try the target's resolved ABI first, then OpenChain.
  if (target) {
    const resolved = await getResolvedAbi(networkName, target)
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

  // OpenChain fallback. Custom errors share the function-selector
  // encoding scheme, so we can re-use the function-signature lookup.
  const openChainSig = await getOpenChainSignature('function', selector)
  if (openChainSig) {
    const synthetic = signatureToFunctionItem(openChainSig)
    if (synthetic) {
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

      // Last-resort: the SDK's own helper (handles plain Error(string)).
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

  return {
    revertReason: null,
    revertKind: 'none',
    possibleSelectorMismatch,
  }
}

export const useTransaction = (transactionId: TransactionId | undefined, networkName?: NetworkName) => {
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  return useQuery(transactionQueryOptions(networkName ?? activeNetworkName, transactionId))
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
