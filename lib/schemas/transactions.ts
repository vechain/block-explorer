import z from 'zod'
import { addressStringSchema, blockIdSchema, blockNumberSchema, hexStringSchema, transactionIdSchema } from './common'
import { rawEventSchema, transferSchema } from './events'

export const clauseSchema = z.object({
  to: addressStringSchema.nullable(),
  value: hexStringSchema, // string | number
  data: hexStringSchema, // string
  comment: z.string().optional(),
  abi: z.string().optional(),
})

export const transactionMetaSchema = z.object({
  blockID: blockIdSchema,
  blockNumber: blockNumberSchema,
  blockTimestamp: z.number(),
  txID: transactionIdSchema.optional(),
  txOrigin: addressStringSchema.optional(),
})

export const baseTransactionSchema = z.object({
  id: transactionIdSchema,
  origin: addressStringSchema,
  gasPayer: addressStringSchema.optional(),
  size: z.number(),
  meta: transactionMetaSchema,
  chainTag: z.number(),
  blockRef: hexStringSchema,
  expiration: z.number(),
  clauses: z.array(clauseSchema),
  gas: z.number(), // string | number
  dependsOn: transactionIdSchema.nullable(),
  nonce: hexStringSchema, // string | number
  reserved: z
    .object({
      features: z.number().optional(),
      unused: z.string().optional(), // Uint8Array[]
    })
    .optional(),
})

export const dynamicFeeTransactionFieldsSchema = z.object({
  maxFeePerGas: hexStringSchema, // string | number
  maxPriorityFeePerGas: hexStringSchema, // string | number
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
  contractAddress: addressStringSchema.nullable(),
  events: z.array(rawEventSchema),
  transfers: z.array(transferSchema),
})

export const transactionReceiptSchema = z.object({
  gasUsed: z.number(),
  gasPayer: addressStringSchema,
  paid: hexStringSchema,
  reward: hexStringSchema,
  reverted: z.boolean(),
  outputs: z.array(outputSchema),
  meta: transactionMetaSchema,
  maxFeePerGas: hexStringSchema.optional(),
  maxPriorityFeePerGas: hexStringSchema.optional(),
})

export type DynamicFeeTransaction = z.infer<typeof dynamicFeeTransactionSchema>
export type LegacyTransaction = z.infer<typeof legacyTransactionSchema>
export type Transaction = z.infer<typeof transactionSchema>
export type TransactionReceipt = z.infer<typeof transactionReceiptSchema>
export type BaseTransaction = z.infer<typeof baseTransactionSchema>
export type Clause = z.infer<typeof clauseSchema>
