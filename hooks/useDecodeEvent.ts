'use client'

import { useMemo } from 'react'
import z from 'zod'
import { decodeEventLog as decodeEventLogFromAbi, signatureToEventItem } from '@/lib/abi-registry'
import { getBundledEventItem } from '@/lib/known-contracts'
import type { HexString, RawEvent } from '@/lib/schemas'
import { addressStringSchema, EventType, rawEventSchema } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { zodParse } from '@/lib/utils/zod'
import { useDecodedSelector } from '@/services/selector-decoder'
import { useResolvedAbi } from '@/services/sourcify'

// `Transfer(address,address,uint256)` shares one signature hash between ERC-20
// and ERC-721 — only the indexed layout differs. A log with 4 topics has all
// three params indexed, which is unambiguously the ERC-721 shape (tokenId
// indexed). Decoding it with an ERC-20 fragment would read the tokenId from the
// (empty) data and drop it, so we resolve this case deterministically first.
const TRANSFER_TOPIC0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const ERC721_TRANSFER_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const

export const useDecodeEvent = (rawEvent: RawEvent) => {
  const topic0 = rawEvent.topics[0] as HexString | undefined

  // 0. Unambiguous ERC-721 Transfer: same signature hash as ERC-20 Transfer but
  // with the tokenId indexed (4 topics). Resolve deterministically so fallbacks
  // don't decode it as an ERC-20 `value`.
  const erc721TransferDecoded = useMemo(() => {
    if (topic0?.toLowerCase() !== TRANSFER_TOPIC0 || rawEvent.topics.length !== 4) return null
    return decodeEventLogFromAbi(ERC721_TRANSFER_ABI, {
      topics: rawEvent.topics as HexString[],
      data: rawEvent.data,
    })
  }, [rawEvent, topic0])

  // 1. Address-aware: emitter's known/Sourcify ABI.
  const { data: resolved, isFetching: resolvedFetching } = useResolvedAbi(rawEvent.address)
  const resolvedDecoded = useMemo(() => {
    if (!resolved?.abi || !topic0) return null
    return decodeEventLogFromAbi(resolved.abi, { topics: rawEvent.topics as HexString[], data: rawEvent.data })
  }, [resolved, rawEvent, topic0])

  // 2. Bundled ABIs: the standard events, without a round-trip. The indexed
  // layout has to match the log's topic count for the fragment to apply.
  const bundledDecoded = useMemo(() => {
    if (erc721TransferDecoded || resolvedDecoded || !topic0) return null
    const item = getBundledEventItem(topic0, rawEvent.topics.length - 1)
    if (!item) return null
    return decodeEventLogFromAbi([item], { topics: rawEvent.topics as HexString[], data: rawEvent.data })
  }, [erc721TransferDecoded, resolvedDecoded, rawEvent, topic0])

  // 3. Selector decoder: server-side b32 → OpenChain fallback in one call.
  const skipSelectorLookup =
    erc721TransferDecoded !== null || resolvedDecoded !== null || bundledDecoded !== null || resolvedFetching
  const { data: selectorResult, isFetching: selectorFetching } = useDecodedSelector(
    'event',
    skipSelectorLookup ? null : (topic0 ?? null),
  )

  const selectorDecoded = useMemo(() => {
    if (erc721TransferDecoded || resolvedDecoded || !selectorResult || !topic0) return null

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
  }, [erc721TransferDecoded, resolvedDecoded, selectorResult, rawEvent, topic0])

  const decoded = erc721TransferDecoded ?? resolvedDecoded ?? bundledDecoded ?? selectorDecoded

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
