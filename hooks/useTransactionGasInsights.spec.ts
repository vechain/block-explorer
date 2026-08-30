import { describe, expect, it } from 'vitest'
import type { TransactionReceipt } from '@/lib/schemas'
import { deriveBaseFeePerGas } from './useTransactionGasInsights'

// Real mainnet receipts, paired with the baseFeePerGas their block reports.
const FIXTURES = [
  {
    name: 'floor base fee, dynamic',
    block: 25_000_000,
    gasUsed: 326446n,
    paid: 0x2f632f7dd6e95000n,
    reward: 0x2157e6adb709000n,
    baseFeePerGas: 10_000_000_000_000n,
  },
  {
    name: 'floor base fee, fee-delegated',
    block: 23_414_400,
    gasUsed: 21000n,
    paid: 0x30f5f94ecf94000n,
    reward: 0x254db1c2244000n,
    baseFeePerGas: 10_000_000_000_000n,
  },
  {
    name: 'zero priority fee',
    block: 25_000_000,
    gasUsed: 25165n,
    paid: 0x37e0a5779ba2000n,
    reward: 0x0n,
    baseFeePerGas: 10_000_000_000_000n,
  },
  {
    name: 'congested block',
    block: 23_347_808,
    gasUsed: 3227371n,
    paid: 0x1e014a879470d4606n,
    reward: 0xdc0e46f742c96f3n,
    baseFeePerGas: 10_411_699_426_937n,
  },
]

const receipt = (over: Partial<TransactionReceipt>) =>
  ({ gasUsed: 0n, paid: 0n, reward: 0n, ...over }) as TransactionReceipt

describe('deriveBaseFeePerGas', () => {
  // Galactica burns the base fee and credits only the priority fee, so the receipt
  // carries the block's base fee exactly — no need to fetch the block to read it.
  it.each(FIXTURES)('recovers the block base fee from the receipt — $name', fixture => {
    expect(deriveBaseFeePerGas(receipt(fixture))).toBe(fixture.baseFeePerGas)
  })

  it('gives up rather than dividing by zero when no gas was used', () => {
    expect(deriveBaseFeePerGas(receipt({ gasUsed: 0n, paid: 1n }))).toBeUndefined()
  })

  it('gives up when the receipt has not resolved', () => {
    expect(deriveBaseFeePerGas(null)).toBeUndefined()
  })
})
