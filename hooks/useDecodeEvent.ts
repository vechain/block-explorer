'use client'

import { useMemo } from 'react'
import z from 'zod'
import { decodeEventLog as decodeEventLogFromAbi, signatureToEventItem } from '@/lib/abi-registry'
import type { HexString, RawEvent } from '@/lib/schemas'
import { addressStringSchema, EventType, rawEventSchema } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { zodParse } from '@/lib/utils/zod'
import { useAbi } from '@/services/b32'
import { useOpenChainSignature } from '@/services/openchain'
import { useResolvedAbi } from '@/services/sourcify'

export const useDecodeEvent = (rawEvent: RawEvent) => {
  const topic0 = rawEvent.topics[0] as HexString | undefined

  // 1. Address-aware: emitter's known/Sourcify ABI.
  const { data: resolved, isFetching: resolvedFetching } = useResolvedAbi(rawEvent.address)
  const resolvedDecoded = useMemo(() => {
    if (!resolved?.abi || !topic0) return null
    return decodeEventLogFromAbi(resolved.abi, { topics: rawEvent.topics as HexString[], data: rawEvent.data })
  }, [resolved, rawEvent, topic0])

  // 2. b32 by topic0.
  const skipB32 = resolvedDecoded !== null || resolvedFetching
  const { data: b32Abi, isFetching: b32Fetching } = useAbi((skipB32 ? '' : topic0) ?? '')

  const b32Decoded = useMemo(() => {
    if (resolvedDecoded || !b32Abi || !topic0) return null
    return decodeEventLogFromAbi(b32Abi, { topics: rawEvent.topics as HexString[], data: rawEvent.data })
  }, [resolvedDecoded, b32Abi, rawEvent, topic0])

  // 3. OpenChain cross-chain signature fallback. We try the canonical
  // OZ "indexed first" layout first; if decoding throws we retry with
  // indexed pushed to the end.
  const wantOpenChain = !resolvedDecoded && !b32Decoded && !b32Fetching && !resolvedFetching
  const { data: openChainSig, isFetching: openChainFetching } = useOpenChainSignature(
    'event',
    wantOpenChain ? (topic0 ?? null) : null,
  )

  const openChainDecoded = useMemo(() => {
    if (!wantOpenChain || !openChainSig || !topic0) return null
    const numIndexed = rawEvent.topics.length - 1
    const candidates = [
      signatureToEventItem(openChainSig, numIndexed, false),
      signatureToEventItem(openChainSig, numIndexed, true),
    ]
    for (const item of candidates) {
      if (!item) continue
      const decoded = decodeEventLogFromAbi([item], { topics: rawEvent.topics as HexString[], data: rawEvent.data })
      if (decoded) return decoded
    }
    return null
  }, [wantOpenChain, openChainSig, rawEvent, topic0])

  const decoded = resolvedDecoded ?? b32Decoded ?? openChainDecoded

  const event: ParsedEvent = useMemo(() => {
    const parsedRaw = parsedRawEventSchema.parse({ type: EventType.RAW, raw: rawEvent })
    if (!decoded) return parsedRaw
    const decodedPayload = zodParse({
      data: {
        address: rawEvent.address,
        signature: decoded.signature,
        signatureHash: decoded.signatureHash,
        name: decoded.name,
        inputs: decoded.inputs,
        args: decoded.args,
      },
      schema: decodedEventSchema,
      errorMessage: 'Failed to parse decoded event',
    })
    return { type: EventType.DECODED, raw: parsedRaw.raw, decoded: decodedPayload }
  }, [decoded, rawEvent])

  // Only treat the hook as "pending" when a request is genuinely in flight.
  // skipToken keeps a query in status='pending' indefinitely, so the older
  // `isPending` aggregation never went false once any branch was skipped.
  return {
    event,
    isPending: resolvedFetching || b32Fetching || openChainFetching,
  }
}

const decodedEventSchema = z.object({
  address: addressStringSchema,
  signature: z.string(),
  signatureHash: z.string(),
  args: z.record(z.string(), z.any()),
  name: z.string(),
  inputs: z.array(abi.eventParameterSchema),
})

const parsedDecodedEventSchema = z.object({
  type: z.literal(EventType.DECODED),
  raw: rawEventSchema,
  decoded: decodedEventSchema,
})

const parsedRawEventSchema = z.object({
  type: z.literal(EventType.RAW),
  raw: rawEventSchema,
})

const _parsedEventSchema = z.discriminatedUnion('type', [parsedDecodedEventSchema, parsedRawEventSchema])

type ParsedEvent = z.infer<typeof _parsedEventSchema>
export type DecodedEvent = z.infer<typeof decodedEventSchema>
