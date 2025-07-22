import { z } from "zod"
import * as coingecko from "../api-client"

const vetVthoUsdPriceSchema = z.object({
  vechain: z.object({
    usd: z.number(),
  }),
  "vethor-token": z.object({
    usd: z.number(),
  }),
})

export async function getVetVthoUsdPrice() {
  const response = await coingecko.get({
    endPoint: "/simple/price",
    params: {
      ids: "vechain,vethor-token",
      vs_currencies: "usd",
    },
  })
  return vetVthoUsdPriceSchema.parse(response)
}
