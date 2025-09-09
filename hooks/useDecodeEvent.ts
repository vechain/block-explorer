'use client'

import { ABIEvent, Hex } from '@vechain/sdk-core'
import type { Abi } from 'viem'
import z from 'zod'
import type { RawEvent } from '@/lib/schemas'
import { addressStringSchema, EventType, rawEventSchema } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { useAbi } from '@/services/b32/hooks'

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
          const decodedEvent = eventAbi.decodeEventLog({
            data: Hex.of(rawEvent.data),
            topics: rawEvent.topics.map(topic => Hex.of(topic)),
          })

          const parsedDecodedEvent = decodedEventSchema.safeParse({
            address: rawEvent.address,
            signature: eventAbi.format(),
            signatureHash: eventAbi.signatureHash,
            args: decodedEvent.args,
            name: eventAbi.signature.name,
            inputs: eventAbi.signature.inputs,
          })

          if (!parsedDecodedEvent.success) {
            console.error({ issues: parsedDecodedEvent.error.issues, decodedEvent, eventAbi })
            return parsedRawEvent
          }

          return {
            type: EventType.DECODED,
            raw: parsedRawEvent.raw,
            decoded: parsedDecodedEvent.data,
          }
        }
      } catch (_error) {}
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

const parsedEventSchema = z.discriminatedUnion('type', [parsedDecodedEventSchema, parsedRawEventSchema])

type ParsedEvent = z.infer<typeof parsedEventSchema>
export type DecodedEventArgs = z.infer<typeof decodedEventSchema.shape.args>
export type DecodedEvent = z.infer<typeof decodedEventSchema>
