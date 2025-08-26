import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"

import { serializeZodParams } from "@/utils/serialization"
import { transactionSchema, GetTransactionsParams } from "./schemas"
import { responseSchema } from "../schemas"
import { zodParse } from "@/utils/zod"

export const getTransactions = async ({ network, params }: { network: NetworkName; params: GetTransactionsParams }) => {
  const response = await veWorldIndexer.get({
    endPoint: "/transactions",
    network,
    params: serializeZodParams(params),
  })

  return zodParse(response, responseSchema(transactionSchema), "Invalid transactions response from VeWorld Indexer")
}
