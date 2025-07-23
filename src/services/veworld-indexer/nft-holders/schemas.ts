import { z } from "zod"

export const nftHoldersSchema = z.object({
  total: z.number(),
  byLevel: z.object({
    Dawn: z.number(),
    Strength: z.number(),
    ThunderX: z.number(),
    Flash: z.number(),
    VeThorX: z.number(),
    Lightning: z.number(),
    StrengthX: z.number(),
    MjolnirX: z.number(),
    Mjolnir: z.number(),
    Thunder: z.number(),
  }),
})
