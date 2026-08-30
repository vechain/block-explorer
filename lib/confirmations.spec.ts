import { describe, expect, it } from 'vitest'
import { confirmationsToShow, CONFIRMATIONS_CAP, isConfirmationsSettled } from './confirmations'
import { BLOCK_TIME_MS, NetworkName } from '@/lib/constants/network'

const NOW = 1_788_080_160_000
const agedBlocks = (blocks: number) => NOW - blocks * BLOCK_TIME_MS
const settledOn = (network: NetworkName, blocks: number) => isConfirmationsSettled(agedBlocks(blocks), network, NOW)

describe('isConfirmationsSettled', () => {
  it('keeps reading the head while the count can still move', () => {
    expect(settledOn(NetworkName.MAINNET, CONFIRMATIONS_CAP)).toBe(false)
  })

  // The window is deliberately far wider than the cap, so missed slots cannot strand a
  // transaction below it while we claim otherwise.
  it('holds on past the cap before trusting the clock', () => {
    expect(settledOn(NetworkName.MAINNET, 4 * CONFIRMATIONS_CAP)).toBe(false)
  })

  it('settles once the chain would have to miss four slots in five to disagree', () => {
    expect(settledOn(NetworkName.MAINNET, 5 * CONFIRMATIONS_CAP + 1)).toBe(true)
  })

  it('settles a transaction from months ago', () => {
    expect(isConfirmationsSettled(NOW - 90 * 24 * 60 * 60 * 1000, NetworkName.TESTNET, NOW)).toBe(true)
  })

  // Solo mints on demand, so an idle node leaves an ancient transaction still at the head.
  it('never settles on solo, however old the transaction looks', () => {
    expect(settledOn(NetworkName.SOLO, 5 * CONFIRMATIONS_CAP + 1)).toBe(false)
    expect(isConfirmationsSettled(NOW - 90 * 24 * 60 * 60 * 1000, NetworkName.SOLO, NOW)).toBe(false)
  })
})

describe('confirmationsToShow', () => {
  const show = (bestBlockNumber: number | undefined, settled = false) =>
    confirmationsToShow({ settled, bestBlockNumber, transactionBlockNumber: 1_000 })

  it('counts depth below the cap', () => {
    expect(show(1_005)).toBe(5)
  })

  it('stops at the cap', () => {
    expect(show(9_999_999)).toBe(CONFIRMATIONS_CAP)
  })

  // A head cached a moment before the transaction landed would otherwise read -1 here
  // while the overview showed 0.
  it('never goes negative when the head trails the transaction', () => {
    expect(show(999)).toBe(0)
  })

  it('waits rather than guessing while the head is unknown', () => {
    expect(show(undefined)).toBeUndefined()
  })

  it('reports the cap once settled, without a head at all', () => {
    expect(show(undefined, true)).toBe(CONFIRMATIONS_CAP)
  })
})
