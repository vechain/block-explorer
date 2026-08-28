import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'

const indexerGet = vi.fn()

vi.mock('.', () => ({
  indexerGet: (...args: unknown[]) => indexerGet(...args),
  resolveUrl: () => 'https://indexer.test/api/v1',
}))

const { totalTransactionsQueryOptions } = await import('./total-transactions')

const point = (cumulativeNumTransactions: string) => ({
  blockId: `0x${'a'.repeat(64)}`,
  blockNumber: 25_739_841,
  blockTimestamp: 1_787_930_400,
  cumulativeGasLimit: '718391835217151',
  cumulativeGasUsed: '466121270',
  cumulativeNumTransactions,
  cumulativeNumClauses: '210000000',
})

const run = () => totalTransactionsQueryOptions(NetworkName.MAINNET).queryFn()
const paramsOf = (call: number) => indexerGet.mock.calls[call][0].params

beforeEach(() => {
  indexerGet.mockResolvedValue({ data: [point('1'), point('158207010')] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  indexerGet.mockReset()
})

describe('totalTransactionsQueryOptions', () => {
  it('reads the total off the last cumulative point', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))

    await expect(run()).resolves.toBe(158207010)
  })

  it('asks for a fixed window rather than the whole chain history', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
    await run()

    const { startTimestamp, endTimestamp } = paramsOf(0)
    expect(Number(endTimestamp) - Number(startTimestamp)).toBe(24 * 60 * 60)
  })

  it('holds one URL across a block interval so viewers share a cache entry', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:03Z'))
    await run()
    vi.setSystemTime(new Date('2026-08-28T12:00:09Z'))
    await run()

    expect(paramsOf(1)).toEqual(paramsOf(0))
  })

  it('moves to a new URL once the interval rolls over', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:09Z'))
    await run()
    vi.setSystemTime(new Date('2026-08-28T12:00:10Z'))
    await run()

    expect(paramsOf(1)).not.toEqual(paramsOf(0))
  })

  it('reports zero when the window holds no blocks', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
    indexerGet.mockResolvedValue({ data: [] })

    await expect(run()).resolves.toBe(0)
  })
})
