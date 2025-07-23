import { z } from "zod"

export const totalVetStakedSchema = z.object({
  total: z.coerce.bigint(),
  byLevel: z.object({
    Dawn: z.coerce.bigint(),
    Strength: z.coerce.bigint(),
    ThunderX: z.coerce.bigint(),
    Flash: z.coerce.bigint(),
    VeThorX: z.coerce.bigint(),
    Lightning: z.coerce.bigint(),
    StrengthX: z.coerce.bigint(),
    MjolnirX: z.coerce.bigint(),
    Mjolnir: z.coerce.bigint(),
    Thunder: z.coerce.bigint(),
  }),
})
