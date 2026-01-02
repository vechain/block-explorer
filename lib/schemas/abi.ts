import type { AbiEvent, AbiParameter } from 'viem'
import { z } from 'zod'

export const parameterSchema = z.object({
  internalType: z.string(),
  name: z.string(),
  type: z.string(),
}) as z.ZodType<AbiParameter>

type AbiEventParameter = AbiEvent['inputs'][number]

export const eventParameterSchema = z.object({
  name: z.string(),
  type: z.string(),
  indexed: z.boolean().optional(),
  internalType: z.string().optional(),
}) as z.ZodType<AbiEventParameter>
