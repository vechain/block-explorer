import { z } from "zod"

export const totalVthoClaimedSchema = z.coerce.bigint()
