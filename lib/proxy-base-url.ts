// Client-safe: no server-only imports, so services can pick proxy vs direct.

const internalOrigin = () =>
  process.env.INTERNAL_ORIGIN?.trim() || `http://127.0.0.1:${process.env.PORT?.trim() || '3000'}`

/** Absolute during a server render, which has no document origin to resolve a path against. */
export const proxyBaseUrl = (base: string) => (typeof window === 'undefined' ? `${internalOrigin()}${base}` : base)
