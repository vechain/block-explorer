import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NetworkName } from '@/lib/constants/network'
import { ApiError } from '@/lib/api'
import { IndexerVersion, indexerFetch, indexerFetchOrNull } from './index'

const ADDRESS = '0x0000000000000000000000000000000000000001'

// Hoisted: the subject is imported statically, so the factory runs before a plain const.
const { get } = vi.hoisted(() => ({ get: vi.fn().mockResolvedValue({ data: {} }) }))

vi.mock('@/lib/api', async () => ({ apiClient: { get }, ApiError: (await import('@/lib/api/types')).ApiError }))

const callOf = () => get.mock.calls[0][0]
// The client joins baseUrl and endPoint bare, so only the pair together shows a missing slash.
const pathOf = () => `${callOf().baseUrl as string}${callOf().endPoint as string}`

describe('indexerFetch', () => {
  beforeEach(() => get.mockClear())

  it.each(['validators', '/validators'])('builds a joinable v1 path from %s', async endPoint => {
    await indexerFetch({ networkName: NetworkName.MAINNET, endPoint })

    expect(pathOf()).toMatch(/\/api\/v1\/validators$/)
    expect(callOf().headers).toMatchObject({ 'X-Project-Id': 'block-explorer' })
  })

  it('honours the endpoint’s own API version', async () => {
    await indexerFetch({
      networkName: NetworkName.MAINNET,
      endPoint: `/validators/${ADDRESS}`,
      version: IndexerVersion.V2,
    })

    expect(pathOf()).toMatch(new RegExp(`/api/v2/validators/${ADDRESS}$`))
  })

  it('reaches solo, whose indexer URL only exists in the browser', async () => {
    await indexerFetch({ networkName: NetworkName.SOLO, endPoint: 'accounts/total' })

    expect(pathOf()).toMatch(/\/accounts\/total$/)
  })
})

describe('indexerFetchOrNull', () => {
  const lookup = { networkName: NetworkName.MAINNET, endPoint: `/contracts/${ADDRESS}` }

  beforeEach(() => get.mockClear())

  it('unwraps the record where the lookup finds one', async () => {
    get.mockResolvedValueOnce({ data: { master: ADDRESS } })

    await expect(indexerFetchOrNull(lookup)).resolves.toEqual({ master: ADDRESS })
  })

  it('turns a 404 into an absent record rather than an error', async () => {
    get.mockRejectedValueOnce(new ApiError({ status: 404 }))

    await expect(indexerFetchOrNull(lookup)).resolves.toBeNull()
  })

  it.each([400, 429, 502, 504])('rethrows a %d rather than reporting an absent record', async status => {
    get.mockRejectedValueOnce(new ApiError({ status }))

    await expect(indexerFetchOrNull(lookup)).rejects.toMatchObject({ status })
  })
})
