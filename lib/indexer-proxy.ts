// Client-safe: no server-only imports, so services can pick proxy vs direct.

/** Relative to `/api/v1`. The server registry must define exactly these. */
const CACHED_INDEXER_ENDPOINTS = [
  'transactions/latest',
  'transactions',
  'transactions/contract',
  'transfers/latest',
  'transfers',
  'explorer/block-usage',
] as const

export type CachedIndexerEndpoint = (typeof CACHED_INDEXER_ENDPOINTS)[number]

export const isCachedIndexerEndpoint = (endPoint: string): endPoint is CachedIndexerEndpoint =>
  (CACHED_INDEXER_ENDPOINTS as readonly string[]).includes(endPoint.replace(/^\/+/, ''))

export const INDEXER_PROXY_BASE = '/api/indexer'
