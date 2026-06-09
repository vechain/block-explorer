'use client'

import { useMemo } from 'react'
import z from 'zod'
import {
  decodeEventLog as decodeEventLogFromAbi,
  signatureToEventItem,
} from '@/lib/abi-registry'
import type { HexString, RawEvent } from '@/lib/schemas'
import { addressStringSchema, EventType, rawEventSchema } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { zodParse } from '@/lib/utils/zod'
import { useDecodedSelector } from '@/services/selector-decoder'
import { useResolvedAbi } from '@/services/sourcify'

export const useDecodeEvent = (rawEvent: RawEvent) => {
  const topic0 = rawEvent.topics[0] as HexString | undefined

  // 1. Address-aware: emitter's known/Sourcify ABI.
  const { data: resolved, isFetching: resolvedFetching } = useResolvedAbi(rawEvent.address)
  const resolvedDecoded = useMemo(() => {
    if (!resolved?.abi || !topic0) return null
    return decodeEventLogFromAbi(resolved.abi, { topics: rawEvent.topics as HexString[], data: rawEvent.data })
  }, [resolved, rawEvent, topic0])

  // 2. Selector decoder: server-side b32 → OpenChain fallback in one call.
  const skipSelectorLookup = resolvedDecoded !== null || resolvedFetching
  const { data: selectorResult, isFetching: selectorFetching } = useDecodedSelector(
    'event',
    skipSelectorLookup ? null : (topic0 ?? null),
  )

  const selectorDecoded = useMemo(() => {
    if (resolvedDecoded || !selectorResult || !topic0) return null

    // b32 fragments come with indexed annotations intact — decode directly.
    if (selectorResult.source === 'b32') {
      return decodeEventLogFromAbi([selectorResult.abi], {
        topics: rawEvent.topics as HexString[],
        data: rawEvent.data,
      })
    }

    // OpenChain returns a bare signature. Try the canonical OZ "indexed
    // first" layout, then fall back to "indexed at the end" — the API
    // doesn't tell us which params are indexed.
    const numIndexed = rawEvent.topics.length - 1
    const candidates = [
      signatureToEventItem(selectorResult.signature, numIndexed, false),
      signatureToEventItem(selectorResult.signature, numIndexed, true),
    ]
    for (const item of candidates) {
      if (!item) continue
      const decoded = decodeEventLogFromAbi([item], { topics: rawEvent.topics as HexString[], data: rawEvent.data })
      if (decoded) return decoded
    }
    return null
  }, [resolvedDecoded, selectorResult, rawEvent, topic0])

  const decoded = resolvedDecoded ?? selectorDecoded

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
    isPending: resolvedFetching || selectorFetching,
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
