import z from 'zod'
import { addressStringSchema, hexStringSchema } from './common'

export const accountSchema = z.object({
  address: addressStringSchema,
  balance: hexStringSchema,
  energy: hexStringSchema,
  hasCode: z.boolean(),
  vet: z.bigint(),
  vtho: z.bigint(),
})

export type Account = z.infer<typeof accountSchema>
