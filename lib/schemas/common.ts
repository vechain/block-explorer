import { hexToBigInt } from 'viem'
import z from 'zod'

export const addressStringSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Must be a valid address string starting with 0x',
}) as z.ZodType<`0x${string}`> // 42 characters including 0x

export const hexStringSchema = z.string().regex(/^0x[a-fA-F0-9]*$/, {
  message: 'Must be a valid hex string starting with 0x',
}) as z.ZodType<`0x${string}`>

// Make these more specific rather than just aliases
export const transactionIdSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
  message: 'Must be a valid transaction ID (64 hex characters)',
}) as z.ZodType<`0x${string}`>

export const blockIdSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, {
  message: 'Must be a valid block ID (64 hex characters)',
}) as z.ZodType<`0x${string}`>

export const blockNumberSchema = z.number()

export const timestampSchema = z.number().transform(timestamp => timestamp * 1000)

export const hexToBigIntSchema = hexStringSchema.transform(hex => hexToBigInt(hex)).pipe(z.bigint())

export type AddressString = z.infer<typeof addressStringSchema>
export type HexString = z.infer<typeof hexStringSchema>
export type TransactionId = z.infer<typeof transactionIdSchema>
