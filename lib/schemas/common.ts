import z from 'zod'

export const addressStringSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Must be a valid address string starting with 0x',
}) as z.ZodType<`0x${string}`> // 42 characters including 0x

export const hexStringSchema = z.string().regex(/^0x[a-fA-F0-9]*$/, {
  message: 'Must be a valid hex string starting with 0x',
}) as z.ZodType<`0x${string}`>

export const transactionIdSchema = hexStringSchema

export const blockIdSchema = hexStringSchema

export const blockNumberSchema = z.number()

export type AddressString = z.infer<typeof addressStringSchema>
export type HexString = z.infer<typeof hexStringSchema>
export type TransactionId = z.infer<typeof transactionIdSchema>
export type BlockId = z.infer<typeof blockIdSchema>
export type BlockNumber = z.infer<typeof blockNumberSchema>
