'use client'

import { ABIEvent, Hex } from '@vechain/sdk-core'
import type { Abi } from 'viem'
import z from 'zod'
import type { RawEvent } from '@/lib/schemas'
import { addressStringSchema, EventType, rawEventSchema } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { zodParse } from '@/lib/utils/zod'
import { useAbi } from '@/services/b32'

export const useDecodeEvent = (rawEvent: RawEvent) => {
  const [signature] = rawEvent.topics

  const { data: abi, ...rest } = useAbi(signature)

  return { event: parseEvent(abi, rawEvent), ...rest }
}

const parseEvent = (abi: Abi | undefined, rawEvent: RawEvent): ParsedEvent => {
  const parsedRawEvent = parsedRawEventSchema.parse({
    type: EventType.RAW,
    raw: rawEvent,
  })

  if (!abi) {
    return parsedRawEvent
  }

  const [signature] = rawEvent.topics

  for (const abiItem of abi) {
    if (abiItem.type === 'event') {
      try {
        const eventAbi = new ABIEvent(abiItem)

        if (eventAbi.signatureHash === signature) {
          const { args } = eventAbi.decodeEventLog({
            data: Hex.of(rawEvent.data),
            topics: rawEvent.topics.map(topic => Hex.of(topic)),
          })

          const data = {
            address: rawEvent.address,
            signature: eventAbi.format(),
            signatureHash: eventAbi.signatureHash,
            name: eventAbi.signature.name,
            inputs: eventAbi.signature.inputs,
            args,
          }

          const decoded = zodParse({
            data,
            schema: decodedEventSchema,
            errorMessage: 'Failed to parse decoded event',
          })

          return {
            type: EventType.DECODED,
            raw: parsedRawEvent.raw,
            decoded,
          }
        }
      } catch {
        return parsedRawEvent
      }
    }
  }

  return parsedRawEvent
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

export type ParsedEvent = z.infer<typeof _parsedEventSchema>
export type DecodedEventArgs = z.infer<typeof decodedEventSchema.shape.args>
export type DecodedEvent = z.infer<typeof decodedEventSchema>
