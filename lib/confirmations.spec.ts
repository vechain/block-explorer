import { describe, expect, it } from 'vitest'
import { BLOCK_TIME_MS } from '@/lib/constants/network'
import { cappedConfirmations, CONFIRMATIONS_CAP, isConfirmationsSettled } from './confirmations'

const NOW = 1_788_080_160_000
const agedBlocks = (blocks: number) => NOW - blocks * BLOCK_TIME_MS

describe('isConfirmationsSettled', () => {
  it('keeps reading the head while the count can still move', () => {
    expect(isConfirmationsSettled(agedBlocks(CONFIRMATIONS_CAP), NOW)).toBe(false)
  })

  // The window is deliberately far wider than the cap, so missed slots cannot strand a
  // transaction below it while we claim otherwise.
  it('holds on past the cap before trusting the clock', () => {
    expect(isConfirmationsSettled(agedBlocks(4 * CONFIRMATIONS_CAP), NOW)).toBe(false)
  })

  it('settles once the chain would have to miss four slots in five to disagree', () => {
    expect(isConfirmationsSettled(agedBlocks(5 * CONFIRMATIONS_CAP + 1), NOW)).toBe(true)
  })

  it('settles a transaction from months ago', () => {
    expect(isConfirmationsSettled(NOW - 90 * 24 * 60 * 60 * 1000, NOW)).toBe(true)
  })
})

describe('cappedConfirmations', () => {
  it('counts depth below the cap', () => {
    expect(cappedConfirmations(1_005, 1_000)).toBe(5)
  })

  it('stops at the cap', () => {
    expect(cappedConfirmations(9_999_999, 1_000)).toBe(CONFIRMATIONS_CAP)
  })

  it('never goes negative when the head lags the transaction', () => {
    expect(cappedConfirmations(999, 1_000)).toBe(0)
  })
})
