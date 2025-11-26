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

export const blockCompressedSchema = z.object({
  id: blockIdSchema,
  number: blockNumberSchema,
  parentID: blockIdSchema,
  timestamp: timestampSchema,
  size: z.number(),
  isFinalized: z.boolean(),
  transactions: z.array(transactionIdSchema),
  txsFeatures: z.number().optional(),
  gasUsed: z.coerce.bigint(),
  gasLimit: z.coerce.bigint(),
  baseFeePerGas: hexToBigIntSchema,
  signer: addressStringSchema,
  beneficiary: addressStringSchema,
  txsRoot: hexStringSchema,
  stateRoot: hexStringSchema,
  receiptsRoot: hexStringSchema,
  totalScore: z.number(),
  isTrunk: z.boolean(),
  com: z.boolean(),
})

export const blockExpandedSchema = z.object({
  id: blockIdSchema,
  number: blockNumberSchema,
  parentID: blockIdSchema,
  timestamp: timestampSchema,
  size: z.number(),
  isFinalized: z.boolean(),
  transactions: z.array(transactionsDetailSchema),
  txsFeatures: z.number().optional(),
  gasUsed: z.coerce.bigint(),
  gasLimit: z.coerce.bigint(),
  baseFeePerGas: hexToBigIntSchema,
  signer: addressStringSchema,
  beneficiary: addressStringSchema,
  txsRoot: hexStringSchema,
  stateRoot: hexStringSchema,
  receiptsRoot: hexStringSchema,
  totalScore: z.number(),
  isTrunk: z.boolean(),
  com: z.boolean(),
})

const blockRevisionEnumSchema = z.enum({
  BEST: 'best',
  NEXT: 'next',
  FINALIZED: 'finalized',
  JUSTIFIED: 'justified',
})

export const blockRevisionSchema = z.union([
  blockRevisionEnumSchema,
  z.coerce.number().int().positive().max(100000000),
  blockNumberSchema,
  blockIdSchema,
])

// Block usage schema for indexer endpoint
const blockUsageDataSchema = z.object({
  blockId: blockIdSchema,
  blockNumber: blockNumberSchema,
  blockTimestamp: timestampSchema,
  cumulativeGasLimit: z.string(),
  cumulativeGasUsed: z.string(),
  cumulativeNumTransactions: z.string(),
  cumulativeNumClauses: z.string(),
})

export const blockUsageResponseSchema = z.array(blockUsageDataSchema)

export type ExpandedBlock = z.infer<typeof blockExpandedSchema>
export type CompressedBlock = z.infer<typeof blockCompressedSchema>
export type BlockRevision = z.infer<typeof blockRevisionSchema>
export type BlockUsageData = z.infer<typeof blockUsageDataSchema>
export type BlockUsageResponse = z.infer<typeof blockUsageResponseSchema>
