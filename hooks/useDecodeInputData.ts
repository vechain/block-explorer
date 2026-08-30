'use client'

import { useMemo } from 'react'
import type { AbiParameter } from 'viem'
import z from 'zod'
import { decodeCalldata as decodeCalldataFromAbi, getSelector, signatureToFunctionItem } from '@/lib/abi-registry'
import { getBundledFunctionItem } from '@/lib/known-contracts'
import { type AddressString, hexStringSchema, type HexString } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { zodParse } from '@/lib/utils/zod'
import { useDecodedSelector } from '@/services/selector-decoder'
import { useResolvedAbi } from '@/services/sourcify'

export type InputData = {
  raw: HexString
  decoded?: DecodedInputData
}

export const useDecodeInputData = (hexData: HexString, address?: AddressString | null) => {
  const selector = getSelector(hexData)

  // 1. Address-aware: known contracts + Sourcify (with EIP-1967 proxy follow).
  // Skipped without a selector — a bare VET transfer has nothing to decode.
  const { data: resolved, isFetching: resolvedFetching } = useResolvedAbi(selector ? (address ?? null) : null)
  const resolvedDecoded = useMemo(() => {
    if (!resolved?.abi) return null
    return decodeCalldataFromAbi(resolved.abi, hexData)
  }, [resolved, hexData])

  // 2. Bundled ABIs: the standard signatures, without a round-trip.
  const bundledDecoded = useMemo(() => {
    if (resolvedDecoded || !selector) return null
    const item = getBundledFunctionItem(selector)
    return item ? decodeCalldataFromAbi([item], hexData) : null
  }, [resolvedDecoded, selector, hexData])

  const skipSelectorLookup = resolvedDecoded !== null || bundledDecoded !== null || resolvedFetching

  // 3. Selector decoder: server-side b32 → OpenChain fallback in one call.
  const { data: selectorResult, isFetching: selectorFetching } = useDecodedSelector(
    'function',
    skipSelectorLookup ? null : selector,
  )

  const selectorDecoded = useMemo(() => {
    if (resolvedDecoded || !selectorResult || !selector) return null
    if (selectorResult.source === 'b32') {
      return decodeCalldataFromAbi([selectorResult.abi], hexData)
    }
    const item = signatureToFunctionItem(selectorResult.signature)
    if (!item) return null
    return decodeCalldataFromAbi([item], hexData)
  }, [resolvedDecoded, selectorResult, selector, hexData])

  const decoded = resolvedDecoded ?? bundledDecoded ?? selectorDecoded

  const data: InputData = useMemo(() => {
    if (!decoded) return { raw: hexStringSchema.parse(hexData) }
    const parsedDecoded = zodParse({
      data: {
        signature: decoded.signature,
        signatureHash: decoded.signatureHash,
        name: decoded.name,
        inputs: decoded.inputs as readonly AbiParameter[],
        args: decoded.args as readonly unknown[],
      },
      schema: decodedInputDataSchema,
      errorMessage: 'Failed to parse decoded input data',
    })
    return { raw: hexStringSchema.parse(hexData), decoded: parsedDecoded }
  }, [decoded, hexData])

  // Only treat the hook as "pending" when a request is genuinely in flight.
  // skipToken keeps a query in status='pending' indefinitely, so the older
  // `isPending` aggregation never went false once any branch was skipped.
  return {
    data,
    isPending: resolvedFetching || selectorFetching,
  }
}

const decodedInputDataSchema = z.object({
  signature: z.string(),
  signatureHash: z.string(),
  args: z.array(z.any()).optional(),
  name: z.string(),
  inputs: z.array(abi.parameterSchema),
})

export type DecodedInputData = z.infer<typeof decodedInputDataSchema>
