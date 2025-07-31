import { Abi } from "viem"
import { ABIFunction, Hex } from "@vechain/sdk-core"
import { useAbi } from "@/services/b32/hooks"

import { HexString } from "@/schemas"
import { DecodedInputData, decodedInputDataSchema } from "@/schemas/input-data"

type InputData = {
  raw: HexString
  decoded?: DecodedInputData
}

export function useDecodeInputData(data: HexString) {
  const signature = data.substring(0, 10)

  const { data: abi, ...rest } = useAbi(signature)

  return { data: parseInputData({ abi, signature, data }), ...rest }
}

function parseInputData({
  abi,
  signature,
  data,
}: {
  abi: Abi | undefined
  signature: string
  data: HexString
}): InputData {
  if (!abi) {
    return { raw: data }
  }

  for (const abiItem of abi) {
    if (abiItem.type === "function") {
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
      } catch (_error) {
        continue
      }
    }
  }

  return { raw: data }
}
