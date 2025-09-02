import { z } from 'zod'
import * as abi from './abi'

const decodedInputDataArgsSchema = z.array(z.any())
export type DecodedInputDataArgs = z.infer<typeof decodedInputDataArgsSchema>

export const decodedInputDataSchema = z.object({
  signature: z.string(),
  signatureHash: z.string(),
  args: decodedInputDataArgsSchema,
  name: z.string(),
  inputs: z.array(abi.parameterSchema),
})

export type DecodedInputData = z.infer<typeof decodedInputDataSchema>
