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

export const indexerResponseSchema = <T extends z.ZodSchema>(schema: T) =>
  z.object({
    data: z.array(schema),
    pagination: paginationSchema,
  })

/***************************** Indexer API params schemas *****************************/

const sortDirectionEnum = z.enum({
  ASC: 'ASC',
  DESC: 'DESC',
})

const paginationParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  direction: sortDirectionEnum.optional(),
})

const indexerGetTransactionsParamsSchema = z
  .object({
    origin: addressStringSchema,
    includeDelegated: z.boolean().optional(),
    expanded: z.boolean().optional(),
  })
  .extend(paginationParamsSchema.shape)

const indexerGetContractTransactionsParamsSchema = z
  .object({
    contractAddress: addressStringSchema,
    expanded: z.boolean().optional(),
  })
  .extend(paginationParamsSchema.shape)

const indexerGetTransfersParamsSchema = z
  .object({
    address: addressStringSchema,
    tokenAddress: addressStringSchema.optional(),
  })
  .extend(paginationParamsSchema.shape)

const indexerGetFungibleTokenContractsParamsSchema = z
  .object({
    address: addressStringSchema,
    officialTokensOnly: z.boolean().optional(),
  })
  .extend(paginationParamsSchema.shape)

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
  .extend(indexerTransactionMetaSchema.shape)
  .extend(transactionReceiptSchema.omit({ meta: true, outputs: true }).shape)
  .extend({
    gasPriceCoef: legacyTransactionFieldsSchema.shape.gasPriceCoef.nullable(),
    maxFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxFeePerGas.nullable(),
    maxPriorityFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxPriorityFeePerGas.nullable(),
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
    gasPriceCoef: legacyTransactionFieldsSchema.shape.gasPriceCoef.nullable(),
    maxFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxFeePerGas.nullable(),
    maxPriorityFeePerGas: dynamicFeeTransactionFieldsSchema.shape.maxPriorityFeePerGas.nullable(),
    type: transactionTypeSchema,
    clauses: z.array(withEmptyObjects(clauseSchema)),
    outputs: z.array(withEmptyObjects(transactionOutputSchema)),
    reverted: z.boolean(),
  })

// "clauses": [
//   {
//     "to": "string",
//     "value": "string",
//     "data": "string"
//   }
// ],

//     "transfers": [
//       {
//         "sender": "string",
//         "recipient": "string",
//         "amount": "string"
//       }
//     ]

const eventTypeSchema = z.enum({
  FUNGIBLE_TOKEN: 'FUNGIBLE_TOKEN',
  NFT: 'NFT',
  VET: 'VET',
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

export const indexerFungibleTokenContractSchema = addressStringSchema

export type IndexerTransfer = z.infer<typeof indexerTransferSchema>
export type IndexerTransaction = z.infer<typeof indexerTransactionSchema>
export type IndexerContractTransaction = z.infer<typeof indexerContractTransactionSchema>
export type IndexerGetTransactionsParams = z.infer<typeof indexerGetTransactionsParamsSchema>
export type IndexerGetTransfersParams = z.infer<typeof indexerGetTransfersParamsSchema>
export type IndexerGetFungibleTokenContractsParams = z.infer<typeof indexerGetFungibleTokenContractsParamsSchema>
export type IndexerFungibleTokenContract = z.infer<typeof indexerFungibleTokenContractSchema>
export type IndexerGetContractTransactionsParams = z.infer<typeof indexerGetContractTransactionsParamsSchema>
