import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_NETWORK, NetworkName } from '@/lib/constants/network'
import {
  appendNetworkSearchParam,
  consumeManualNetworkSearchParamSync,
  getDashboardPathname,
  getFallbackNetworkName,
  getHrefWithNetworkSearchParam,
  getManualNetworkSwitchHref,
  getNetworkNameFromSearchParams,
  getTransactionIdFromPathname,
  markNextNetworkSearchParamSyncAsManual,
  parseNetworkName,
  resetManualNetworkSearchParamSync,
  resolveNetworkName,
} from './network'

describe('Network utils', () => {
  const transactionId = '0x30a8a2d5990e21ad2d5bbb2a225038fbe605080473a3b3a16601dbcf2c3c9b62'

  beforeEach(() => {
    resetManualNetworkSearchParamSync()
  })

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

  it('returns the opposite network for fallback checks', () => {
    expect(getFallbackNetworkName(NetworkName.MAINNET)).toBe(NetworkName.TESTNET)
    expect(getFallbackNetworkName(NetworkName.TESTNET)).toBe(NetworkName.MAINNET)
    expect(getFallbackNetworkName(NetworkName.SOLO)).toBeNull()
  })

  it('updates the current href with the selected network', () => {
    expect(
      getHrefWithNetworkSearchParam({
        pathname: '/transactions/0xabc',
        searchParams: new URLSearchParams('view=events'),
        networkName: NetworkName.TESTNET,
      }),
    ).toBe('/transactions/0xabc?view=events&network=testnet')
  })

  it('preserves the current hash when updating the network', () => {
    expect(
      getHrefWithNetworkSearchParam({
        pathname: '/transactions/0xabc',
        searchParams: new URLSearchParams('network=mainnet'),
        networkName: NetworkName.TESTNET,
        hash: 'transaction-details',
      }),
    ).toBe('/transactions/0xabc?network=testnet#transaction-details')
  })

  it('extracts transaction ids from transaction pathnames', () => {
    expect(getTransactionIdFromPathname(`/transactions/${transactionId}`)).toBe(transactionId)
    expect(getTransactionIdFromPathname(`/it/transactions/${transactionId}`)).toBe(transactionId)
    expect(getTransactionIdFromPathname('/block/123')).toBeNull()
  })

  it('returns the locale-aware dashboard pathname', () => {
    expect(getDashboardPathname(`/it/transactions/${transactionId}`)).toBe('/it')
    expect(getDashboardPathname(`/transactions/${transactionId}`)).toBe('/')
  })

  it('keeps the transaction route when the selected network has the transaction', () => {
    expect(
      getManualNetworkSwitchHref({
        pathname: `/transactions/${transactionId}`,
        searchParams: new URLSearchParams('view=events'),
        networkName: NetworkName.TESTNET,
        transactionExistsOnTargetNetwork: true,
      }),
    ).toBe(`/transactions/${transactionId}?view=events&network=testnet`)
  })

  it('redirects to the locale-aware dashboard when the transaction is missing on the selected network', () => {
    expect(
      getManualNetworkSwitchHref({
        pathname: `/it/transactions/${transactionId}`,
        searchParams: new URLSearchParams('view=events'),
        networkName: NetworkName.TESTNET,
        transactionExistsOnTargetNetwork: false,
      }),
    ).toBe('/it?network=testnet')
  })

  it('updates the current route when it is already pinned to a specific network', () => {
    expect(
      getManualNetworkSwitchHref({
        pathname: '/block/123',
        searchParams: new URLSearchParams('network=mainnet'),
        networkName: NetworkName.TESTNET,
      }),
    ).toBe('/block/123?network=testnet')
  })

  it('returns null for manual switches on routes that are not network-pinned', () => {
    expect(
      getManualNetworkSwitchHref({
        pathname: '/block/123',
        searchParams: new URLSearchParams('view=overview'),
        networkName: NetworkName.TESTNET,
      }),
    ).toBeNull()
  })

  it('appends the network search param to internal hrefs', () => {
    expect(appendNetworkSearchParam('/transactions/0xabc', NetworkName.SOLO)).toBe('/transactions/0xabc?network=solo')
    expect(appendNetworkSearchParam('/transactions/0xabc?view=events', NetworkName.SOLO)).toBe(
      '/transactions/0xabc?view=events&network=solo',
    )
    expect(appendNetworkSearchParam('/transactions/0xabc#section', NetworkName.SOLO)).toBe(
      '/transactions/0xabc?network=solo#section',
    )
    expect(appendNetworkSearchParam('/transactions/0xabc?network=mainnet', NetworkName.TESTNET)).toBe(
      '/transactions/0xabc?network=testnet',
    )
  })

  it('leaves non-internal hrefs unchanged when appending the network search param', () => {
    expect(appendNetworkSearchParam('https://example.com/foo', NetworkName.SOLO)).toBe('https://example.com/foo')
    expect(appendNetworkSearchParam('mailto:foo@bar.com', NetworkName.SOLO)).toBe('mailto:foo@bar.com')
  })

  it('leaves protocol-relative hrefs unchanged when appending the network search param', () => {
    expect(appendNetworkSearchParam('//example.com/foo', NetworkName.SOLO)).toBe('//example.com/foo')
    expect(appendNetworkSearchParam('//example.com', NetworkName.SOLO)).toBe('//example.com')
  })

  it('suppresses the next matching manual network sync only once', () => {
    markNextNetworkSearchParamSyncAsManual(NetworkName.TESTNET)

    expect(consumeManualNetworkSearchParamSync(NetworkName.MAINNET)).toBe(false)
    expect(consumeManualNetworkSearchParamSync(NetworkName.TESTNET)).toBe(true)
    expect(consumeManualNetworkSearchParamSync(NetworkName.TESTNET)).toBe(false)
  })
})
