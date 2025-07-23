import { z } from "zod"
import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"

import { serializeZodParams } from "@/utils/serialization"
import { transactionSchema, paginationSchema, paramsSchema } from "./schemas"

export type GetAccountTransactionsParams = z.infer<typeof paramsSchema>

export async function getTransactions({
  network,
  params,
}: {
  network: NetworkName
  params: GetAccountTransactionsParams
}) {
  const response = await veWorldIndexer.get({
    endPoint: "/transactions",
    network,
    params: serializeZodParams(params),
  })

  const parsedResponse = z
    .object({
      data: z.array(transactionSchema),
      pagination: paginationSchema,
    })
    .safeParse(response)

  if (!parsedResponse.success) {
    console.error(parsedResponse.error.issues)
    throw new Error("Invalid response from API")
  }

  return parsedResponse.data
}
