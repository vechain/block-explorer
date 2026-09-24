import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import {
  SLOTS_WINDOW_ANCHOR_SECONDS,
  reliabilityPercentage,
  validatorReliabilityQueryOptions,
} from './validator-details'

const ADDRESS = '0x0000000000000000000000000000000000000001'
const WEEK_IN_SECONDS = 7 * 24 * 60 * 60

// Hoisted: the subject is imported statically, so the factory runs before a plain const.
const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/lib/api', async () => ({ apiClient: { get }, ApiError: (await import('@/lib/api/types')).ApiError }))

const fetchReliability = () => validatorReliabilityQueryOptions(NetworkName.MAINNET, ADDRESS).queryFn()

const windowOf = (call: number) => {
  const { startTimestamp, endTimestamp } = get.mock.calls[call][0].params as Record<string, string>
  return { start: Number(startTimestamp), end: Number(endTimestamp) }
}

describe('validator reliability window', () => {
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
    await fetchReliability()

    const { start, end } = windowOf(0)
    expect(end % SLOTS_WINDOW_ANCHOR_SECONDS).toBe(0)
    expect(start).toBe(end - WEEK_IN_SECONDS)
  })

  // The address page polls this every 60s per viewer. A key that moved faster than the
  // proxy entry lived is what made the endpoint miss its cache ~99.9% of the time.
  it('keeps one key across the 60s poll', async () => {
    await fetchReliability()
    vi.advanceTimersByTime(60_000)
    await fetchReliability()

    expect(windowOf(1)).toEqual(windowOf(0))
  })

  it('moves to the next window once the anchor has passed', async () => {
    await fetchReliability()
    vi.advanceTimersByTime(SLOTS_WINDOW_ANCHOR_SECONDS * 1000)
    await fetchReliability()

    expect(windowOf(1).end).toBe(windowOf(0).end + SLOTS_WINDOW_ANCHOR_SECONDS)
  })
})

describe('validator reliability', () => {
  const slots = (extra: Record<string, number>) => ({
    data: { validator: ADDRESS, proposedBlocks: 295, missedSlots: 1, missedSlotRatio: 1 / 296, ...extra },
  })

  it('is uptime, so a multi-day outage with one missed slot is not 100%', async () => {
    get.mockReset().mockResolvedValue(slots({ uptimeRatio: 0.3 }))
    expect(await fetchReliability()).toBe(30)
  })

  it('falls back to the missed-slot ratio when the indexer has no uptime', async () => {
    get.mockReset().mockResolvedValue(slots({ missedSlotRatio: 0.25 }))
    expect(await fetchReliability()).toBe(75)
  })

  it('floors to one decimal so a partial outage never shows as 100%', () => {
    expect(reliabilityPercentage(0.9996, 0)).toBe(99.9)
    expect(reliabilityPercentage(0.29, 0)).toBe(29)
    expect(reliabilityPercentage(1, 0)).toBe(100)
    expect(reliabilityPercentage(undefined, 2.5)).toBe(97.5)
  })
})
