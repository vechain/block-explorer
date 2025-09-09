import { z } from 'zod'
import {
  addressStringSchema,
  baseTransactionSchema,
  clauseSchema,
  dynamicFeeTransactionFieldsSchema,
  hexStringSchema,
  legacyTransactionFieldsSchema,
  outputSchema,
  rawEventSchema,
  transactionMetaSchema,
  transactionReceiptSchema,
  transactionTypeSchema,
  transferSchema,
} from '@/lib/schemas'

/***************************** Indexer API common schemas *****************************/

const paginationSchema = z.object({
  hasCount: z.boolean(),
  countLimit: z.number(),
  totalPages: z.number().nullable(),
  totalElements: z.number().nullable(),
  hasNext: z.boolean(),
})

const paginationParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  direction: z.enum(['ASC', 'DESC']).optional(),
})

export const indexerResponseSchema = <T extends z.ZodSchema>(schema: T) =>
  z.object({
    data: z.array(schema),
    pagination: paginationSchema,
  })

/***************************** Indexer API params schemas *****************************/
const transactionsParamsSchema = z
  .object({
    origin: addressStringSchema,
    includeDelegated: z.boolean().optional(),
    expanded: z.boolean().optional(),
  })
  .extend(paginationParamsSchema.shape)

const transfersParamsSchema = z
  .object({
    address: addressStringSchema,
    tokenAddress: addressStringSchema.optional(),
  })
  .extend(paginationParamsSchema.shape)

const eventTypeSchema = z.enum({
  FUNGIBLE_TOKEN: 'FUNGIBLE_TOKEN',
  NFT: 'NFT',
  VET: 'VET',
})

/***************************** Indexer API resources schemas *****************************/
const withEmptyObjects = (schema: z.ZodSchema) => z.union([schema, z.object({})])

const indexerBaseTransferSchema = z.object({
  from: transferSchema.shape.sender,
  to: transferSchema.shape.recipient,
  value: transferSchema.shape.amount,
})

const transactionOutputSchema = z.object({
  contractAddress: outputSchema.pick({ contractAddress: true }),
  events: z.array(
    rawEventSchema.extend({
      name: z.string(),
      params: z.record(z.string(), z.unknown()),
    }),
  ),
  transfers: z.array(indexerBaseTransferSchema),
})

const indexerTransactionMetaSchema = transactionMetaSchema.pick({ blockNumber: true, blockTimestamp: true }).extend({
  blockId: transactionMetaSchema.shape.blockID,
  txId: transactionMetaSchema.shape.txID,
})

export const indexerTransactionSchema = baseTransactionSchema
  .omit({ meta: true, clauses: true })
  .extend({
    maxFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxFeePerGas.nullable(),
    maxPriorityFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxPriorityFeePerGas.nullable(),
  })
  .extend({
    gasPriceCoef: legacyTransactionFieldsSchema.shape.gasPriceCoef.nullable(),
  })
  .extend(indexerTransactionMetaSchema.shape)
  .extend(transactionReceiptSchema.omit({ meta: true, outputs: true }).shape)
  .extend({
    type: transactionTypeSchema,
    clauses: z.array(withEmptyObjects(clauseSchema)),
    outputs: z.array(withEmptyObjects(transactionOutputSchema)),
    reverted: z.boolean(),
  })

export const indexerTransferSchema = indexerBaseTransferSchema.extend(indexerTransactionMetaSchema.shape).extend({
  id: z.string(),
  txId: transactionMetaSchema.shape.txID.nonoptional(),
  value: z.coerce.bigint(),
  tokenAddress: addressStringSchema.nullable(),
  tokenId: z.string().nullable(),
  topics: z.array(hexStringSchema),
  eventType: eventTypeSchema,
})

export type IndexerTransfer = z.infer<typeof indexerTransferSchema>
export type IndexerGetTransactionsParams = z.infer<typeof transactionsParamsSchema>
export type IndexerGetTransfersParams = z.infer<typeof transfersParamsSchema>
