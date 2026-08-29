import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import { VALIDATOR_SLOTS_ANCHOR_SECONDS } from '@/lib/indexer-proxy'
import { validatorMissedBlocksQueryOptions } from './validator-details'

const ADDRESS = '0x0000000000000000000000000000000000000001'
const WEEK_IN_SECONDS = 7 * 24 * 60 * 60

// Hoisted: the subject is imported statically, so the factory runs before a plain const.
const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/lib/api', async () => ({ apiClient: { get }, ApiError: (await import('@/lib/api/types')).ApiError }))

const fetchMissedBlocks = () => validatorMissedBlocksQueryOptions(NetworkName.MAINNET, ADDRESS).queryFn()

const windowOf = (call: number) => {
  const { startTimestamp, endTimestamp } = get.mock.calls[call][0].params as Record<string, string>
  return { start: Number(startTimestamp), end: Number(endTimestamp) }
}

describe('validator missed-blocks window', () => {
  beforeEach(() => {
    get.mockReset().mockResolvedValue({
      data: { validator: ADDRESS, proposedBlocks: 1954, missedSlots: 0, missedSlotRatio: 0 },
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-29T10:07:23Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rounds the window down to the anchor rather than to the current second', async () => {
    await fetchMissedBlocks()

    const { start, end } = windowOf(0)
    expect(end % VALIDATOR_SLOTS_ANCHOR_SECONDS).toBe(0)
    expect(start).toBe(end - WEEK_IN_SECONDS)
  })

  // The address page polls this every 60s per viewer. A key that moved faster than the
  // proxy entry lived is what made the endpoint miss its cache ~99.9% of the time.
  it('keeps one key across the 60s poll', async () => {
    await fetchMissedBlocks()
    vi.advanceTimersByTime(60_000)
    await fetchMissedBlocks()

    expect(windowOf(1)).toEqual(windowOf(0))
  })

  it('moves to the next window once the anchor has passed', async () => {
    await fetchMissedBlocks()
    vi.advanceTimersByTime(VALIDATOR_SLOTS_ANCHOR_SECONDS * 1000)
    await fetchMissedBlocks()

    expect(windowOf(1).end).toBe(windowOf(0).end + VALIDATOR_SLOTS_ANCHOR_SECONDS)
  })
})
