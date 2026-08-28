import { z } from 'zod'

const MAX_LOGGED_ISSUES = 5

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
    // One line, and everything variable inside the JSON so it stays one line: console's
    // object formatter walks the whole payload, callers interpolate on-chain strings into
    // the context, and a schema that fails does so on every request.
    console.error(
      `Zod parsing failed: ${JSON.stringify({
        context: errorMessage ?? 'Unknown error',
        issues: result.error.issues.slice(0, MAX_LOGGED_ISSUES).map(issue => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
        totalIssues: result.error.issues.length,
      })}`,
    )

    if (typeof fallbackData !== 'undefined') {
      return fallbackData as z.infer<T>
    }

    return data as z.infer<T>
  }

  return result.data as z.infer<T>
}
