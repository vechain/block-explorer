import { z } from 'zod'

export const zodParse = <T extends z.ZodSchema>({
  data,
  schema,
  errorMessage,
  fallbackData,
}: {
  data: unknown
  schema: T
  errorMessage?: string
  fallbackData?: unknown
}): z.infer<T> => {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.group('Zod Parsing failed:', errorMessage || 'Unknown error')
    console.error('Error:', z.treeifyError(result.error))
    console.error('Data:', data)
    console.groupEnd()

    if (fallbackData) {
      return fallbackData as z.infer<T>
    }

    throw new Error(errorMessage || 'Zod Parsing failed')
  }

  return result.data as z.infer<T>
}
