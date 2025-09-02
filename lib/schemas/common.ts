import z from 'zod'

export const addressStringSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Must be a valid address string starting with 0x',
}) as z.ZodType<`0x${string}`> // 42 characters including 0x

export type AddressString = z.infer<typeof addressStringSchema>

export const hexStringSchema = z.string().regex(/^0x[a-fA-F0-9]*$/, {
  message: 'Must be a valid hex string starting with 0x',
}) as z.ZodType<`0x${string}`>

export type HexString = z.infer<typeof hexStringSchema>
