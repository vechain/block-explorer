import { describe, expect, it } from 'vitest'
import { DEFAULT_NETWORK, NetworkName } from '@/lib/constants/network'
import { getNetworkNameFromSearchParams, parseNetworkName, resolveNetworkName } from './network'

describe('Network utils', () => {
  it('parses supported network names', () => {
    expect(parseNetworkName('mainnet')).toBe(NetworkName.MAINNET)
    expect(parseNetworkName('testnet')).toBe(NetworkName.TESTNET)
    expect(parseNetworkName('solo')).toBe(NetworkName.SOLO)
  })

  it('returns null for unsupported network names', () => {
    expect(parseNetworkName('invalid-network')).toBeNull()
  })

  it('resolves to the default network for invalid params', () => {
    expect(resolveNetworkName('invalid-network')).toBe(DEFAULT_NETWORK.name)
    expect(resolveNetworkName(undefined)).toBe(DEFAULT_NETWORK.name)
  })

  it('reads the network from search params', () => {
    expect(getNetworkNameFromSearchParams(new URLSearchParams('network=testnet'))).toBe(NetworkName.TESTNET)
    expect(getNetworkNameFromSearchParams(new URLSearchParams('view=events'))).toBeNull()
  })
})
