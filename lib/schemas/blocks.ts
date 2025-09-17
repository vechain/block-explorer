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
    delegator: addressStringSchema.nullable(),
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

const blockRevisionSchema = blockRevisionEnumSchema.or(blockNumberSchema).or(blockIdSchema)

export type ExpandedBlockDetail = z.infer<typeof expandedBlockDetailSchema>
export type BlockRevision = z.infer<typeof blockRevisionSchema>
