import { describe, expect, it } from 'vitest'
import type { ValidatorDetails } from '@/services/veworld-indexer/validator-details'
import { countdownTickMs, cycleEndsAtMs } from './cycle-countdown'

// A real mainnet validator: 7-day cycles, 23 of them done, anchored on block 25,754,875.
const ANCHOR_MS = 1_788_080_160_000
const VALIDATOR = {
  startBlock: 24_321_780,
  cyclePeriodLength: 60_480,
  completedPeriods: 23,
  chainHead: { number: 25_754_875, timestamp: ANCHOR_MS },
} as ValidatorDetails

const DAY_MS = 24 * 60 * 60 * 1000

describe('cycleEndsAtMs', () => {
  // The anchor is already milliseconds; scaling it again put the countdown 20 million days out.
  it('keeps the anchor in milliseconds', () => {
    const remaining = cycleEndsAtMs(VALIDATOR)! - ANCHOR_MS

    expect(remaining / DAY_MS).toBeCloseTo(2.13, 2)
  })

  it('projects the cycle end from the anchored block at the chain cadence', () => {
    // 25,773,300 - 25,754,875 = 18,425 blocks left, at 10s each.
    expect(cycleEndsAtMs(VALIDATOR)).toBe(ANCHOR_MS + 18_425 * 10_000)
  })

  it('has nothing to project before the anchor arrives', () => {
    expect(cycleEndsAtMs({ ...VALIDATOR, chainHead: undefined })).toBeNull()
  })

  it('has no cycle to end when the period length is unknown', () => {
    expect(cycleEndsAtMs({ ...VALIDATOR, cyclePeriodLength: 0 })).toBeNull()
  })
})

const MINUTE_MS = 60_000

describe('countdownTickMs', () => {
  it('idles at a minute while the label reads days and hours', () => {
    expect(countdownTickMs(3 * 24 * 60 * MINUTE_MS)).toBe(MINUTE_MS)
    expect(countdownTickMs(MINUTE_MS + 1)).toBe(MINUTE_MS)
  })

  // Below a minute the label counts seconds, which a minute-long tick would freeze.
  it('ticks every second through the final minute', () => {
    expect(countdownTickMs(MINUTE_MS)).toBe(1_000)
    expect(countdownTickMs(1)).toBe(1_000)
  })

  it('drops back to a minute once the cycle has passed', () => {
    expect(countdownTickMs(0)).toBe(MINUTE_MS)
    expect(countdownTickMs(-5_000)).toBe(MINUTE_MS)
  })

  it('idles when there is no cycle end to count towards', () => {
    expect(countdownTickMs(null)).toBe(MINUTE_MS)
  })
})
