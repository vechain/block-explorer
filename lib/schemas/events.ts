import z from 'zod'
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

export const transferSchema = z.object({
  sender: addressStringSchema,
  recipient: addressStringSchema,
  amount: hexStringSchema,
})

export type Transfer = z.infer<typeof transferSchema>
export type RawEvent = z.infer<typeof rawEventSchema>
