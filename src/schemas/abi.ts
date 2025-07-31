import { AbiEvent } from "viem"
import { z } from "zod"

export type AbiEventParameter = AbiEvent["inputs"][number]

export const eventParameterSchema = z.object({
  name: z.string(),
  type: z.string(),
  indexed: z.boolean().optional(),
  internalType: z.string().optional(),
}) as z.ZodType<AbiEventParameter>
