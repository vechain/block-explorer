import { z } from 'zod'
import {
  addressStringSchema,
  baseTransactionSchema,
  blockIdSchema,
  blockNumberSchema,
  clauseSchema,
  dynamicFeeTransactionFieldsSchema,
  hexStringSchema,
  legacyTransactionFieldsSchema,
  outputSchema,
  rawEventSchema,
  transactionIdSchema,
  transactionMetaSchema,
  transactionReceiptSchema,
  transactionTypeSchema,
  transferSchema,
} from '@/lib/schemas'

// ***************************** Indexer API common schemas *****************************/

const paginationSchema = z.object({
  hasCount: z.boolean(),
  countLimit: z.number(),
  totalPages: z.number().nullable().optional(),
  totalElements: z.number().nullable().optional(),
  hasNext: z.boolean(),
})

export const indexerResponseSchema = <T extends z.ZodSchema>(schema: T) =>
  z.object({
    data: z.array(schema),
    pagination: paginationSchema,
  })

// ***************************** Indexer API params schemas *****************************/

const sortDirectionEnum = z.enum({
  ASC: 'ASC',
  DESC: 'DESC',
})

const paginationParamsSchema = z.object({
  page: z.number().nullable().optional(),
  size: z.number().nullable().optional(),
  direction: sortDirectionEnum.nullable().optional(),
})

const indexerGetTransactionsParamsSchema = z
  .object({
    origin: addressStringSchema,
    includeDelegated: z.boolean().nullable().optional(),
    expanded: z.boolean().nullable().optional(),
  })
  .extend(paginationParamsSchema.shape)

const indexerGetContractTransactionsParamsSchema = z
  .object({
    contractAddress: addressStringSchema,
    expanded: z.boolean().nullable().optional(),
  })
  .extend(paginationParamsSchema.shape)

const indexerGetTransfersParamsSchema = z
  .object({
    address: addressStringSchema,
    tokenAddress: addressStringSchema.nullable().optional(),
  })
  .extend(paginationParamsSchema.shape)

const indexerGetErc20ContractsParamsSchema = z
  .object({
    address: addressStringSchema,
    officialTokensOnly: z.boolean().nullable().optional(),
  })
  .extend(paginationParamsSchema.shape)

const indexerGetErc721ParamsSchema = z
  .object({
    address: addressStringSchema,
    contractAddress: addressStringSchema.optional(),
    tokenId: z.string().optional(),
  })
  .extend(paginationParamsSchema.shape)

// ***************************** Indexer API resources schemas *****************************/
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
  .extend(indexerTransactionMetaSchema.shape)
  .extend(transactionReceiptSchema.omit({ meta: true, outputs: true }).shape)
  .extend({
    gasPriceCoef: legacyTransactionFieldsSchema.shape.gasPriceCoef.nullable().optional(),
    maxFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxFeePerGas.nullable().optional(),
    maxPriorityFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxPriorityFeePerGas.nullable().optional(),
    type: transactionTypeSchema,
    clauses: z.array(withEmptyObjects(clauseSchema)),
    outputs: z.array(withEmptyObjects(transactionOutputSchema)),
    reverted: z.boolean(),
  })

export const indexerContractTransactionSchema = baseTransactionSchema
  .omit({ meta: true, clauses: true })
  .extend(indexerTransactionMetaSchema.shape)
  .extend(transactionReceiptSchema.omit({ meta: true, outputs: true }).shape)
  .extend({
    gasPriceCoef: legacyTransactionFieldsSchema.shape.gasPriceCoef.nullable().optional(),
    maxFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxFeePerGas.nullable().optional(),
    maxPriorityFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxPriorityFeePerGas.nullable().optional(),
    type: transactionTypeSchema,
    clauses: z.array(withEmptyObjects(clauseSchema)),
    outputs: z.array(withEmptyObjects(transactionOutputSchema)),
    reverted: z.boolean(),
  })

const eventTypeSchema = z.enum({
  FUNGIBLE_TOKEN: 'FUNGIBLE_TOKEN',
  NFT: 'NFT',
  VET: 'VET',
})

export const indexerTransferSchema = indexerBaseTransferSchema.extend(indexerTransactionMetaSchema.shape).extend({
  id: z.string(),
  txId: transactionMetaSchema.shape.txID.nonoptional(),
  value: z.coerce.bigint(),
  tokenAddress: addressStringSchema.nullable().optional(),
  tokenId: z.string().nullable().optional(),
  topics: z.array(hexStringSchema),
  eventType: eventTypeSchema,
})

export const indexerErc721Schema = z.object({
  id: z.string(),
  version: z.number(),
  tokenId: z.coerce.bigint(),
  contractAddress: addressStringSchema,
  owner: addressStringSchema,
  txId: transactionIdSchema,
  blockNumber: blockNumberSchema,
  blockId: blockIdSchema,
  blockTimestamp: z.number(),
})

export type IndexerTransfer = z.infer<typeof indexerTransferSchema>
export type IndexerTransaction = z.infer<typeof indexerTransactionSchema>
export type IndexerContractTransaction = z.infer<typeof indexerContractTransactionSchema>
export type IndexerGetTransactionsParams = z.infer<typeof indexerGetTransactionsParamsSchema>
export type IndexerGetTransfersParams = z.infer<typeof indexerGetTransfersParamsSchema>
export type IndexerGetErc20ContractsParams = z.infer<typeof indexerGetErc20ContractsParamsSchema>
export type IndexerGetContractTransactionsParams = z.infer<typeof indexerGetContractTransactionsParamsSchema>
export type IndexerGetErc721Params = z.infer<typeof indexerGetErc721ParamsSchema>
export type IndexerResponse<T extends z.ZodSchema> = z.infer<ReturnType<typeof indexerResponseSchema<T>>>
