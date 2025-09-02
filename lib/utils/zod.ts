import { z } from 'zod'

export const zodParse = <T extends z.ZodSchema>(data: unknown, schema: T, errorMessage?: string): z.infer<T> => {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.group('Zod Parsing failed')
    console.error(z.prettifyError(result.error))
    console.error('--------------------------------')
    console.error(data)
    console.groupEnd()

    throw new Error(errorMessage || 'Zod Parsing failed')
  }

  return result.data
}
