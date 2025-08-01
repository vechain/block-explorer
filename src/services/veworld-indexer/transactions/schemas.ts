import { z } from "zod"
import { addressStringSchema, hexStringSchema } from "@/schemas"
import { rawEventSchema } from "@/schemas/events"
import { paginationParamsSchema } from "../schemas"

export const paramsSchema = z
  .object({
    origin: addressStringSchema,
    includeDelegated: z.boolean().optional(),
    expanded: z.boolean().optional(),
  })
  .extend(paginationParamsSchema.shape)

export type GetTransactionsParams = z.infer<typeof paramsSchema>

const transactionClausesSchema = z.object({
  to: addressStringSchema,
  value: hexStringSchema,
  data: hexStringSchema,
})

const transactionEventSchema = rawEventSchema.extend({
  name: z.string(),
  params: z.record(z.string(), z.unknown()),
})

const transactionTransferSchema = z.object({
  from: addressStringSchema,
  to: addressStringSchema,
  value: hexStringSchema,
})

const transactionOutputSchema = z.object({
  contractAddress: addressStringSchema.nullable(),
  events: z.array(transactionEventSchema),
  transfers: z.array(transactionTransferSchema),
})

const transactionBaseSchema = z.object({
  id: hexStringSchema,
  chainTag: z.number(),
  blockRef: hexStringSchema,
  expiration: z.number(),
  clauses: z.array(z.union([transactionClausesSchema, z.object({})])),
  gas: z.number(),
  origin: addressStringSchema,
  blockId: hexStringSchema,
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  size: z.number(),
  gasUsed: z.number(),
  gasPayer: addressStringSchema,
  paid: hexStringSchema,
  reward: hexStringSchema,
  reverted: z.boolean(),
  dependsOn: hexStringSchema.nullable(),
  nonce: hexStringSchema,
  outputs: z.array(z.union([transactionOutputSchema, z.object({})])),
})

const transactionLegacySchema = transactionBaseSchema.extend({
  type: z.literal(0),
  gasPriceCoef: z.number().nullable(),
})

const transactionDynamicFeeSchema = transactionBaseSchema.extend({
  type: z.literal(81),
  maxFeePerGas: hexStringSchema,
  maxPriorityFeePerGas: hexStringSchema,
})

export const transactionSchema = z.discriminatedUnion("type", [transactionLegacySchema, transactionDynamicFeeSchema])
