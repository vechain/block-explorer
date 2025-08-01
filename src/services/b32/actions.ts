import { Abi } from "viem"
import * as b32 from "./api-client"

export async function getAbi({ signature }: { signature: string }) {
  const endPoint = `/q/${signature}.json`

  const res = await b32.get({ endPoint })
  return res as Abi
}
