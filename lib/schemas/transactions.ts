import z from 'zod'
import {
  addressStringSchema,
  blockIdSchema,
  blockNumberSchema,
  hexStringSchema,
  hexToBigIntSchema,
  timestampSchema,
  transactionIdSchema,
} from './common'
import { rawEventSchema, transferSchema } from './events'

export const clauseSchema = z.object({
  to: addressStringSchema.nullable().optional(),
  value: hexToBigIntSchema,
  data: hexStringSchema,
  comment: z.string().nullable().optional(),
  abi: z.string().nullable().optional(),
})

export const transactionMetaSchema = z.object({
  blockID: blockIdSchema,
  blockNumber: blockNumberSchema,
  blockTimestamp: timestampSchema,
  txID: transactionIdSchema.optional(),
  txOrigin: addressStringSchema.nullable().optional(),
})

export const baseTransactionSchema = z.object({
  id: transactionIdSchema,
  origin: addressStringSchema,
  gasPayer: addressStringSchema.nullable().optional(),
  size: z.number(),
  meta: transactionMetaSchema,
  chainTag: z.number(),
  blockRef: hexStringSchema,
  expiration: z.number(),
  clauses: z.array(clauseSchema),
  gas: z.coerce.bigint(),
  dependsOn: transactionIdSchema.nullable().optional(),
  nonce: hexStringSchema,
  reserved: z
    .object({
      features: z.number().nullable().optional(),
      unused: z.string().nullable().optional(), // Uint8Array[]
    })
    .nullable()
    .optional(),
})

export const dynamicFeeTransactionFieldsSchema = z.object({
  maxFeePerGas: hexToBigIntSchema,
  maxPriorityFeePerGas: hexToBigIntSchema,
})

export const legacyTransactionFieldsSchema = z.object({
  gasPriceCoef: z.number(),
})

export const transactionTypeSchema = z.enum({
  LEGACY: 0,
  DYNAMIC_FEE: 81,
})

const dynamicFeeTransactionSchema = baseTransactionSchema.extend(dynamicFeeTransactionFieldsSchema.shape).extend({
  type: z.literal(transactionTypeSchema.enum.DYNAMIC_FEE),
})

const legacyTransactionSchema = baseTransactionSchema.extend(legacyTransactionFieldsSchema.shape).extend({
  type: z.literal(transactionTypeSchema.enum.LEGACY),
})

export const transactionSchema = z.discriminatedUnion('type', [dynamicFeeTransactionSchema, legacyTransactionSchema])

export const outputSchema = z.object({
  contractAddress: addressStringSchema.nullable().optional(),
  events: z.array(rawEventSchema),
  transfers: z.array(transferSchema),
})

export const transactionReceiptSchema = z.object({
  gasUsed: z.coerce.bigint(),
  gasPayer: addressStringSchema,
  paid: hexToBigIntSchema,
  reward: hexToBigIntSchema,
  reverted: z.boolean(),
  outputs: z.array(outputSchema),
  meta: transactionMetaSchema,
})

export type Transaction = z.infer<typeof transactionSchema>
export type TransactionReceipt = z.infer<typeof transactionReceiptSchema>
export type Clause = z.infer<typeof clauseSchema>
