import { z } from "zod"

/**
 * Type-safe version that works with Zod schemas
 */
export const serializeZodParams = <T extends z.ZodRawShape>(params: z.infer<z.ZodObject<T>>): Record<string, string> => {
  return serializeToSearchParams(params)
}

/**
 * Serializes an object to search params format
 * Converts all values to strings and only includes defined (non-undefined) values
 */
const serializeToSearchParams = <T extends Record<string, unknown>>(params: T): Record<string, string> => {
  const serialized: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      serialized[key] = String(value)
    }
  }

  return serialized
}
