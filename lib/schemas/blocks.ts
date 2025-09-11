import z from 'zod'
import { addressStringSchema, hexStringSchema } from './common'
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
  id: hexStringSchema,
  number: z.number(),
  parentID: hexStringSchema,
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

export type ExpandedBlockDetail = z.infer<typeof expandedBlockDetailSchema>
