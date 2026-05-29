'use client'

import { useMemo } from 'react'
import type { AbiParameter } from 'viem'
import z from 'zod'
import { decodeCalldata as decodeCalldataFromAbi, getSelector, signatureToFunctionItem } from '@/lib/abi-registry'
import { type AddressString, hexStringSchema, type HexString } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { zodParse } from '@/lib/utils/zod'
import { useAbi } from '@/services/b32'
import { useOpenChainSignature } from '@/services/openchain'
import { useResolvedAbi } from '@/services/sourcify'

export type InputData = {
  raw: HexString
  decoded?: DecodedInputData
}

export const useDecodeInputData = (hexData: HexString, address?: AddressString | null) => {
  // 1. Address-aware: known contracts + Sourcify (with EIP-1967 proxy follow).
  const { data: resolved, isPending: resolvedPending } = useResolvedAbi(address ?? null)
  const resolvedDecoded = useMemo(() => {
    if (!resolved?.abi) return null
    return decodeCalldataFromAbi(resolved.abi, hexData)
  }, [resolved, hexData])

  const selector = getSelector(hexData)
  const upstreamPending = resolvedPending
  const skipB32 = resolvedDecoded !== null || upstreamPending

  // 2. b32 keccak DB by 4-byte selector.
  const { data: b32Abi, isPending: b32Pending } = useAbi((skipB32 ? '' : selector) ?? '')

  const b32Decoded = useMemo(() => {
    if (resolvedDecoded || !b32Abi || !selector) return null
    return decodeCalldataFromAbi(b32Abi, hexData)
  }, [resolvedDecoded, b32Abi, selector, hexData])

  // 3. OpenChain canonical-signature fallback.
  const wantOpenChain = !resolvedDecoded && !b32Decoded && !b32Pending && !upstreamPending
  const { data: openChainSig, isPending: openChainPending } = useOpenChainSignature(
    'function',
    wantOpenChain ? selector : null,
  )

  const openChainDecoded = useMemo(() => {
    if (!wantOpenChain || !openChainSig) return null
    const item = signatureToFunctionItem(openChainSig)
    if (!item) return null
    return decodeCalldataFromAbi([item], hexData)
  }, [wantOpenChain, openChainSig, hexData])

  const decoded = resolvedDecoded ?? b32Decoded ?? openChainDecoded

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

  return {
    data,
    isPending: resolvedPending || b32Pending || openChainPending,
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
