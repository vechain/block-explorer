'use client'

import { ABIFunction, Hex } from '@vechain/sdk-core'
import type { Abi } from 'viem'
import z from 'zod'
import { type HexString, hexStringSchema } from '@/lib/schemas'
import * as abi from '@/lib/schemas/abi'
import { useAbi } from '@/services/b32/hooks'

type InputData = {
  raw: HexString
  decoded?: DecodedInputData
}

export const useDecodeInputData = (data: HexString) => {
  const signature = data.substring(0, 10)

  const { data: abi, ...rest } = useAbi(signature)

  return { data: parseInputData({ abi, signature, data }), ...rest }
}

const parseInputData = ({
  abi,
  signature,
  data,
}: {
  abi: Abi | undefined
  signature: string
  data: HexString
}): InputData => {
  if (!abi) {
    return { raw: data }
  }

  for (const abiItem of abi) {
    if (abiItem.type === 'function') {
      try {
        const functionAbi = new ABIFunction(abiItem)

        if (functionAbi.signatureHash === signature) {
          const decodedInputData = functionAbi.decodeData(Hex.of(data))

          const parsedDecodedInputData = decodedInputDataSchema.safeParse({
            signature: functionAbi.format(),
            signatureHash: functionAbi.signatureHash,
            args: decodedInputData.args,
            name: functionAbi.signature.name,
            inputs: functionAbi.signature.inputs,
          })

          if (!parsedDecodedInputData.success) {
            console.error(parsedDecodedInputData.error.issues)
            return { raw: data }
          }

          return {
            raw: data,
            decoded: parsedDecodedInputData.data,
          }
        }
      } catch (_error) {}
    }
  }

  return { raw: data }
}

const decodedInputDataSchema = z.object({
  signature: z.string(),
  signatureHash: z.string(),
  args: z.array(z.any()).optional(),
  name: z.string(),
  inputs: z.array(abi.parameterSchema),
})

export type DecodedInputDataArgs = z.infer<typeof decodedInputDataSchema.shape.args>
export type DecodedInputData = z.infer<typeof decodedInputDataSchema>
