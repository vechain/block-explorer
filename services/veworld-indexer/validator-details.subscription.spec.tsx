import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NETWORK } from '@/lib/constants/network'
import { makeQueryClient } from '@/lib/query-client/query-client'
import { useSettingsStore } from '@/lib/stores/settings'
import { useValidatorDetails } from './validator-details'
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const ADDRESS = '0x0000000000000000000000000000000000000001'

const VALIDATOR = {
  id: ADDRESS,
  status: 'ACTIVE',
  startBlock: 24_321_780,
  cyclePeriodLength: 60_480,
  completedPeriods: 23,
}

const { indexerCachedGet, indexerCachedGetOrNull } = vi.hoisted(() => ({
  indexerCachedGet: vi.fn(),
  indexerCachedGetOrNull: vi.fn(),
}))

vi.mock('.', () => ({
  IndexerVersion: { V1: 'v1', V2: 'v2' },
  indexerCachedGet,
  indexerCachedGetOrNull,
}))
vi.mock('./validator-metadata', () => ({
  validatorMetadataQueryOptions: () => ({ queryKey: ['validatorMetadata'], queryFn: async () => null }),
}))

let bestBlockRequests: number

const installFetch = () => {
  bestBlockRequests = 0
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string) => {
      const url = new URL(String(input), 'http://localhost')
      if (url.pathname === '/api/thor/blocks/best') bestBlockRequests++

      return Promise.resolve(
        new Response(JSON.stringify({ number: 25_754_875, timestamp: 1_788_080_160 }), { status: 200 }),
      )
    }),
  )
}

const settle = async () => {
  for (let index = 0; index < 40; index++) await act(async () => await vi.advanceTimersByTimeAsync(1))
}

const renderValidatorDetails = () => {
  const client = makeQueryClient()
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: 0 } })

  const Probe = () => {
    useValidatorDetails(ADDRESS)
    return null
  }

  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  )
}

// The head is the busiest endpoint we serve, and only the validator cycle countdown reads
// it here — so a gate that silently stopped gating would not show up anywhere else.
describe('best block subscription gate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installFetch()
    indexerCachedGet.mockResolvedValue({ data: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    useSettingsStore.setState({ activeNetwork: DEFAULT_NETWORK })
  })

  it('never asks for the head on an address that is not a validator', async () => {
    indexerCachedGetOrNull.mockResolvedValue(null)

    renderValidatorDetails()
    await settle()

    expect(bestBlockRequests).toBe(0)
  })

  it('asks for the head once the address resolves as a validator', async () => {
    indexerCachedGetOrNull.mockResolvedValue(VALIDATOR)

    renderValidatorDetails()
    await settle()

    expect(bestBlockRequests).toBeGreaterThan(0)
  })
})
