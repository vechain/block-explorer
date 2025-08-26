import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"

import { serializeZodParams } from "@/utils/serialization"
import { responseSchema } from "../schemas"
import { transferSchema, GetTransfersParams } from "./schemas"
import { zodParse } from "@/utils/zod"

export const getTransfers = async ({ network, params }: { network: NetworkName; params: GetTransfersParams }) => {
  const response = await veWorldIndexer.get({
    endPoint: "/transfers",
    network,
    params: serializeZodParams(params),
  })

  return zodParse(response, responseSchema(transferSchema), "Invalid transfers response from VeWorld Indexer")
}
