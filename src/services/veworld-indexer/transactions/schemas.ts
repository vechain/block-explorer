import { z } from "zod"
import { addressStringSchema } from "@/utils/address"

const transactionClausesSchema = z.object({
  to: z.string(),
  value: z.string(),
  data: z.string(),
})

const transactionEventSchema = z.object({
  address: z.string().nullable(),
  topics: z.array(z.string()),
  data: z.string(),
  name: z.string(),
  params: z.record(z.string(), z.unknown()),
})

const transactionTransferSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.string(),
})

const transactionOutputSchema = z.object({
  contractAddress: z.string().nullable(),
  events: z.array(transactionEventSchema),
  transfers: z.array(transactionTransferSchema),
})

const transactionBaseSchema = z.object({
  id: z.string(),
  chainTag: z.number(),
  blockRef: z.string(),
  expiration: z.number(),
  clauses: z.array(z.union([transactionClausesSchema, z.object({})])),
  gas: z.number(),
  origin: z.string(),
  blockId: z.string(),
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  size: z.number(),
  gasUsed: z.number(),
  gasPayer: z.string(),
  paid: z.string(),
  reward: z.string(),
  reverted: z.boolean(),
  dependsOn: z.string().nullable(),
  nonce: z.string(),
  outputs: z.array(z.union([transactionOutputSchema, z.object({})])),
})

const transactionLegacySchema = transactionBaseSchema.extend({
  type: z.literal(0),
  gasPriceCoef: z.number().nullable(),
})

const transactionDynamicFeeSchema = transactionBaseSchema.extend({
  type: z.literal(81),
  maxFeePerGas: z.string(),
  maxPriorityFeePerGas: z.string(),
})

export const transactionSchema = z.discriminatedUnion("type", [transactionLegacySchema, transactionDynamicFeeSchema])

export const paginationSchema = z.object({
  hasCount: z.boolean(),
  countLimit: z.number(),
  totalPages: z.number().nullable(),
  totalElements: z.number().nullable(),
  hasNext: z.boolean(),
})

export const paramsSchema = z.object({
  origin: addressStringSchema,
  includeDelegated: z.boolean().optional(),
  expanded: z.boolean().optional(),
  page: z.number().optional(),
  size: z.number().optional(),
  direction: z.enum(["ASC", "DESC"]).optional(),
})
