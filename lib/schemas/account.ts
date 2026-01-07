import z from 'zod'
import { addressStringSchema, hexToBigIntSchema } from './common'

export const accountSchema = z.object({
  address: addressStringSchema,
  balance: hexToBigIntSchema,
  energy: hexToBigIntSchema,
  hasCode: z.boolean(),
  vet: z.bigint(),
  vtho: z.bigint(),
})
