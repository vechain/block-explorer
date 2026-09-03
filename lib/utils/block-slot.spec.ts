import { describe, expect, it } from 'vitest'
import { BLOCK_TIME_MS } from '@/lib/constants/network'
import { INDEXER_SETTLE_MS, nextBlockRefetchDelay } from './block-slot'

const SLOT = 1_700_000_000_000

describe('nextBlockRefetchDelay', () => {
  it('falls back to the block interval before any block is known', () => {
    expect(nextBlockRefetchDelay(undefined)).toBe(BLOCK_TIME_MS)
  })

  it('aims at the settle point after the next slot', () => {
    const now = SLOT + 2_000
    expect(nextBlockRefetchDelay(SLOT, INDEXER_SETTLE_MS, now)).toBe(BLOCK_TIME_MS + INDEXER_SETTLE_MS - 2_000)
  })

  it('retries every second once the next block is overdue', () => {
    expect(nextBlockRefetchDelay(SLOT, INDEXER_SETTLE_MS, SLOT + BLOCK_TIME_MS + INDEXER_SETTLE_MS)).toBe(1_000)
    expect(nextBlockRefetchDelay(SLOT, INDEXER_SETTLE_MS, SLOT + 2 * BLOCK_TIME_MS)).toBe(1_000)
  })

  it('lets a negative settle poll before the slot closes', () => {
    expect(nextBlockRefetchDelay(SLOT, -2_000, SLOT)).toBe(BLOCK_TIME_MS - 2_000)
  })

  it('never waits longer than one block interval', () => {
    expect(nextBlockRefetchDelay(SLOT, 5_000, SLOT)).toBe(BLOCK_TIME_MS)
  })

  it('stops hammering a chain whose head is several slots old', () => {
    expect(nextBlockRefetchDelay(SLOT, INDEXER_SETTLE_MS, SLOT + 4 * BLOCK_TIME_MS)).toBe(BLOCK_TIME_MS)
  })
})
