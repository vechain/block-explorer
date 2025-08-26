import { z } from "zod"
import * as coinApi from "../api-client"

export const getPriceList = async () => {
  const response = await coinApi.get({
    endPoint: "/price-list",
    params: { expanded: "false" },
  })

  return responseSchema.parse(response)
}

const tokensSchema = z.enum([
  "vet",
  "vtho",
  "usdglo",
  "hai",
  "b3tr",
  "vot3",
  "sha",
  "bvet",
  "yeet",
  "wov",
  "coj",
  "vvet",
  "sht",
  "btc",
  "eth",
  "sol",
  "usdc",
  "usdt",
  "wan",
  "xrp",
  "veed",
  "mva",
  "veusd",
  "wvet",
  "vsea",
  "oce",
  "vpu",
  "gold",
  "jur",
  "mvg",
  "vex",
  "dhn",
  "pla",
  "ppr",
  "union",
  "dragon",
  "banana",
  "vst",
  "dbet",
  "ehrt",
  "tic",
  "gems",
  "mdn",
  "squad",
  "sass",
  "dwvet",
])

const responseSchema = z.record(
  tokensSchema,
  z
    .object({
      price_usd: z.coerce.number(),
      price_eur: z.coerce.number(),
      price_cny: z.coerce.number(),
      price_vet: z.coerce.number(),
      last_updated: z.coerce.number(),
    })
    .transform(data => ({
      usd: data.price_usd,
      eur: data.price_eur,
      cny: data.price_cny,
      vet: data.price_vet,
      lastUpdated: data.last_updated,
    })),
)
