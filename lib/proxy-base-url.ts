import { getInternalOrigin } from '@/lib/runtime-config/get'

// Client-safe: no server-only imports, so services can pick proxy vs direct.

/** Absolute during a server render, which has no document origin to resolve a path against. */
export const proxyBaseUrl = (base: string) => (typeof window === 'undefined' ? `${getInternalOrigin()}${base}` : base)
