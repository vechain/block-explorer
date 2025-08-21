import { z } from "zod"
import { NetworkName } from "@/constants/network"
import * as veWorldIndexer from "../api-client"

import { serializeZodParams } from "@/utils/serialization"
import { paginationSchema } from "../schemas"
import { transferSchema, GetTransfersParams } from "./schemas"

export const getTransfers = async ({ network, params }: { network: NetworkName; params: GetTransfersParams }) => {
  const response = await veWorldIndexer.get({
    endPoint: "/transfers",
    network,
    params: serializeZodParams(params),
  })

  const parsedResponse = z
    .object({
      data: z.array(transferSchema),
      pagination: paginationSchema,
    })
    .safeParse(response)

  if (!parsedResponse.success) {
    console.error(parsedResponse.error.issues)
    throw new Error("Invalid transfers response from API")
  }

  return parsedResponse.data
}
