import { z } from "zod"
import { addressStringSchema, hexStringSchema } from "@/schemas"
import { paginationParamsSchema } from "../schemas"

const eventTypeSchema = z.enum(["FUNGIBLE_TOKEN", "NFT", "VET"])

export const transferSchema = z.object({
  id: z.string(),
  blockId: hexStringSchema,
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  txId: hexStringSchema,
  from: addressStringSchema,
  to: addressStringSchema,
  value: z.coerce.bigint(),
  tokenAddress: addressStringSchema,
  tokenId: z.string().nullable(),
  topics: z.array(hexStringSchema),
  eventType: eventTypeSchema,
})

export type Transfer = z.infer<typeof transferSchema>

export const paramsSchema = z
  .object({
    address: addressStringSchema,
    tokenAddress: addressStringSchema.optional(),
  })
  .extend(paginationParamsSchema.shape)

export type GetTransfersParams = z.infer<typeof paramsSchema>
