import { BLOCK_TIME_MS } from '@/lib/constants/network'

/** Measured on mainnet: the index serves a new block 0.1–0.6 s after its slot closes. */
export const INDEXER_SETTLE_MS = 1_500
const RETRY_MS = 1_000
const IDLE_HEAD_MS = 3 * BLOCK_TIME_MS

/**
 * Aims the next poll just past the point the following block should exist, then retries each second
 * while the head stays put; a chain idle for several slots drops back to the plain interval.
 */
export const nextBlockRefetchDelay = (
  latestBlockTimestamp: number | undefined,
  settleMs = INDEXER_SETTLE_MS,
  now = Date.now(),
): number => {
  if (latestBlockTimestamp === undefined) return BLOCK_TIME_MS
  if (now - latestBlockTimestamp > IDLE_HEAD_MS) return BLOCK_TIME_MS
  const target = latestBlockTimestamp + BLOCK_TIME_MS + settleMs
  return Math.min(BLOCK_TIME_MS, Math.max(RETRY_MS, target - now))
}
