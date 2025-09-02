import z from 'zod'
import * as abi from './abi'
import { addressStringSchema, hexStringSchema } from './common'

export enum EventType {
  RAW = 'raw',
  DECODED = 'decoded',
}

export const rawEventSchema = z.object({
  address: addressStringSchema,
  topics: z.array(hexStringSchema),
  data: hexStringSchema,
})

export const parsedRawEventSchema = z.object({ type: z.literal(EventType.RAW), raw: rawEventSchema })

const decodedEventArgsSchema = z.record(z.string(), z.any())
export type DecodedEventArgs = z.infer<typeof decodedEventArgsSchema>

export const decodedEventSchema = z.object({
  address: addressStringSchema,
  signature: z.string(),
  signatureHash: z.string(),
  args: decodedEventArgsSchema,
  name: z.string(),
  inputs: z.array(abi.eventParameterSchema),
})
export type DecodedEvent = z.infer<typeof decodedEventSchema>

const parsedDecodedEventSchema = z.object({
  type: z.literal(EventType.DECODED),
  raw: rawEventSchema,
  decoded: decodedEventSchema,
})

const parsedEventSchema = z.discriminatedUnion('type', [parsedDecodedEventSchema, parsedRawEventSchema])
export type ParsedEvent = z.infer<typeof parsedEventSchema>
