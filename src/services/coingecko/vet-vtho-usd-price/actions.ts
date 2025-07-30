import { z } from "zod"
import * as coingecko from "../api-client"

export async function getTokenUsdPrice(tokens: string[]) {
  const response = await coingecko.get({
    endPoint: "/simple/price",
    params: {
      ids: tokens.join(","),
      vs_currencies: "usd",
    },
  })

  const dynamicSchema = z
    .record(z.string(), z.object({ usd: z.number() }))
    .refine(data => tokens.every(token => token in data), {
      message: `Missing required tokens: ${tokens.join(", ")}`,
    })

  return dynamicSchema.parse(response)
}
