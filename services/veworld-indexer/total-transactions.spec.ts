import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'

const indexerGet = vi.fn()

vi.mock('.', () => ({
  indexerFetch: (...args: unknown[]) => indexerGet(...args),
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

  it('goes to the cached proxy path, not straight at the indexer', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
    await run()

    expect(indexerGet.mock.calls[0][0]).toMatchObject({
      networkName: NetworkName.MAINNET,
      endPoint: 'explorer/block-usage',
    })
  })

  it('falls back to all history rather than reporting zero on an idle chain', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
    indexerGet.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [point('158207010')] })

    await expect(run()).resolves.toBe(158207010)
    expect(Number(paramsOf(1).startTimestamp)).toBe(1530316800)
  })

  it('reports zero only when even the full history is empty', async () => {
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'))
    indexerGet.mockResolvedValue({ data: [] })

    await expect(run()).resolves.toBe(0)
  })
})
