/**
 * Simple helper to log Promise.allSettled failures with query identifiers.
 * Use this when you have an existing Promise.allSettled call and just want to add logging.
 */
export function logPrefetchFailures(results: PromiseSettledResult<unknown>[], queryIdentifiers: string[]): void {
  const failures = results
    .map((result, index) => ({ result, identifier: queryIdentifiers[index] }))
    .filter(({ result }) => result.status === 'rejected')

  if (failures.length > 0) {
    console.error('[Prefetch] Some queries failed to prefetch:', {
      failedCount: failures.length,
      totalCount: results.length,
      failures: failures.map(({ result, identifier }) => ({
        query: identifier,
        error: result.status === 'rejected' ? (result as PromiseRejectedResult).reason : undefined,
      })),
    })
  }
}
