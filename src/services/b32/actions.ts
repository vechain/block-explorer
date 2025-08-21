import { Abi } from "viem"
import * as b32 from "./api-client"

export const getAbi = async ({ signature }: { signature: string }) => {
  const endPoint = `/q/${signature}.json`

  const res = await b32.get({ endPoint })
  return res as Abi
}
