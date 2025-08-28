import { z } from "zod"

export const zodParse = <T extends z.ZodSchema>(response: unknown, schema: T, errorMessage?: string): z.infer<T> => {
  const result = schema.safeParse(response)

  if (!result.success) {
    console.error(z.prettifyError(result.error))
    console.error({ response })

    throw new Error(errorMessage || "Zod Parsing failed")
  }

  return result.data
}
