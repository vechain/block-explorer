import { z } from "zod"

export const paginationSchema = z.object({
  hasCount: z.boolean(),
  countLimit: z.number(),
  totalPages: z.number().nullable(),
  totalElements: z.number().nullable(),
  hasNext: z.boolean(),
})

export const paginationParamsSchema = z.object({
  page: z.number().optional(),
  size: z.number().optional(),
  direction: z.enum(["ASC", "DESC"]).optional(),
})
