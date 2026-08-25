import { z } from 'zod'
import { type BlockRevision, blockIdSchema } from '@/lib/schemas'

// Client-safe: no server-only imports, so services can pick proxy vs direct.

export const THOR_PROXY_BASE = '/api/thor'

// Aliases (`best`, `finalized`, …) are excluded so a cache key always names one specific
// block. Ordered so a block ID is never read as a hex number, and decimal-only so two
// spellings of one revision cannot fork the cache. The bound mirrors `blockRevisionSchema`.
export const concreteBlockRevisionSchema = z.union([
  blockIdSchema,
  z.number().int().min(0).max(100_000_000),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().max(100_000_000)),
])

export const isConcreteBlockRevision = (revision: BlockRevision) =>
  concreteBlockRevisionSchema.safeParse(revision).success

export const BEST_BLOCK_ENDPOINT = '/blocks/best'
export const BLOCK_ENDPOINT = '/blocks'
