import z from 'zod'
import { addressStringSchema, blockIdSchema, blockNumberSchema, hexStringSchema } from './common'
import {
  baseTransactionSchema,
  dynamicFeeTransactionFieldsSchema,
  legacyTransactionFieldsSchema,
  transactionReceiptSchema,
  transactionTypeSchema,
} from './transactions'

const transactionsDetailSchema = baseTransactionSchema
  .omit({ meta: true })
  .extend(dynamicFeeTransactionFieldsSchema.partial().shape)
  .extend(legacyTransactionFieldsSchema.partial().shape)
  .extend(transactionReceiptSchema.omit({ meta: true }).shape)
  .extend({
    type: transactionTypeSchema,
    delegator: addressStringSchema.nullable().optional(),
  })

export const expandedBlockDetailSchema = z.object({
  id: blockIdSchema,
  number: blockNumberSchema,
  parentID: blockIdSchema,
  timestamp: z.number(),
  size: z.number(),
  isFinalized: z.boolean(),
  transactions: z.array(transactionsDetailSchema),
  txsFeatures: z.number().optional(),
  gasUsed: z.number(),
  gasLimit: z.number(),
  baseFeePerGas: hexStringSchema.optional(),
  signer: addressStringSchema,
  beneficiary: addressStringSchema,
  txsRoot: hexStringSchema,
  stateRoot: hexStringSchema,
  receiptsRoot: hexStringSchema,
  totalScore: z.number(),
  isTrunk: z.boolean(),
  com: z.boolean(),
})

export const blockRevisionEnumSchema = z.enum({
  BEST: 'best',
  NEXT: 'next',
  FINALIZED: 'finalized',
  JUSTIFIED: 'justified',
})

export const blockRevisionSchema = blockRevisionEnumSchema
  .or(z.coerce.number().int().positive().max(100000000))
  .or(blockNumberSchema)
  .or(blockIdSchema)

// Block usage schema for indexer endpoint
export const blockUsageDataSchema = z.object({
  blockId: blockIdSchema,
  blockNumber: blockNumberSchema,
  blockTimestamp: z.number(),
  cumulativeGasLimit: z.string(),
  cumulativeGasUsed: z.string(),
  cumulativeNumTransactions: z.string(),
  cumulativeNumClauses: z.string(),
})

export const blockUsageResponseSchema = z.array(blockUsageDataSchema)

export type ExpandedBlockDetail = z.infer<typeof expandedBlockDetailSchema>
export type BlockRevision = z.infer<typeof blockRevisionSchema>
export type BlockUsageData = z.infer<typeof blockUsageDataSchema>
export type BlockUsageResponse = z.infer<typeof blockUsageResponseSchema>
