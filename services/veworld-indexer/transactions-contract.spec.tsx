import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AddressString } from '@/lib/schemas'
import { makeQueryClient } from '@/lib/query-client/query-client'
import { IndexerVersion, indexerFetch } from '.'
import { useContractTransactions } from './transactions-contract'

vi.mock('.', async importOriginal => ({
  ...(await importOriginal<typeof import('.')>()),
  indexerFetch: vi.fn(),
}))
vi.mock('@/lib/utils/zod', () => ({ zodParse: ({ data }: { data: unknown }) => data }))

const mockIndexerFetch = vi.mocked(indexerFetch)
const contractAddress = `0x${'a'.repeat(40)}` as AddressString

const page = (ids: string[], cursor?: string) =>
  ({ data: { data: ids.map(id => ({ id })), pagination: { hasNext: Boolean(cursor), cursor } } }) as Awaited<
    ReturnType<typeof indexerFetch>
  >

const render = (initialPage: number) => {
  const queryClient = makeQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(({ p }) => useContractTransactions({ contractAddress, page: p, size: 2 }), {
    wrapper,
    initialProps: { p: initialPage },
  })
}

afterEach(() => vi.clearAllMocks())

describe('useContractTransactions', () => {
  it('fetches the next page from v2 with the cursor the previous page returned', async () => {
    mockIndexerFetch.mockResolvedValueOnce(page(['t1', 't2'], '9|0xb')).mockResolvedValueOnce(page(['t3']))
    const { result, rerender } = render(0)

    await waitFor(() => expect(result.current.data?.data).toEqual([{ id: 't1' }, { id: 't2' }]))
    expect(mockIndexerFetch.mock.calls[0][0]).toMatchObject({
      endPoint: '/transactions/contract',
      version: IndexerVersion.V2,
      params: { contractAddress, size: '2' },
    })

    rerender({ p: 1 })
    expect(result.current).toMatchObject({ isLoading: false, data: { data: [{ id: 't1' }, { id: 't2' }] } })
    await waitFor(() => expect(result.current.data?.data).toEqual([{ id: 't3' }]))
    expect(mockIndexerFetch.mock.calls[1][0].params).toEqual({ contractAddress, size: '2', cursor: '9|0xb' })

    rerender({ p: 0 })
    expect(result.current.data?.data).toEqual([{ id: 't1' }, { id: 't2' }])
    expect(mockIndexerFetch).toHaveBeenCalledTimes(2)
  })
})
