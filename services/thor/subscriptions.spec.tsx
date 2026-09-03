import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_NETWORK, NETWORKS, NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { pendingTxSchema, subscriptionUrl, useThorSubscription } from './subscriptions'

class FakeSocket {
  static instances: FakeSocket[] = []
  url: string
  closed = false
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(url: string) {
    this.url = url
    FakeSocket.instances.push(this)
  }

  close() {
    this.closed = true
    this.onclose?.()
  }
}

const latest = () => FakeSocket.instances.at(-1)!
const hex = (seed: string) => `0x${seed.repeat(64)}`

beforeEach(() => {
  vi.useFakeTimers()
  FakeSocket.instances = []
  vi.stubGlobal('WebSocket', FakeSocket)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  useSettingsStore.setState({ activeNetwork: DEFAULT_NETWORK })
})

describe('subscriptionUrl', () => {
  it('swaps the scheme and appends the subscription path', () => {
    expect(subscriptionUrl('https://mainnet.vechain.org', 'block')).toBe(
      'wss://mainnet.vechain.org/subscriptions/block',
    )
    expect(subscriptionUrl('http://localhost:8669/', 'txpool')).toBe('ws://localhost:8669/subscriptions/txpool')
  })
})

describe('useThorSubscription', () => {
  it('opens a socket against the active node and reports when it connects', () => {
    const { result } = renderHook(() =>
      useThorSubscription({ path: 'txpool', schema: pendingTxSchema, onMessage: vi.fn() }),
    )

    expect(latest().url).toBe(subscriptionUrl(DEFAULT_NETWORK.url, 'txpool'))
    expect(result.current).toBe(false)

    act(() => latest().onopen?.())
    expect(result.current).toBe(true)
  })

  it('delivers frames that match the schema and drops the rest', () => {
    const onMessage = vi.fn()
    renderHook(() => useThorSubscription({ path: 'txpool', schema: pendingTxSchema, onMessage }))

    act(() => {
      latest().onmessage?.({ data: JSON.stringify({ id: hex('a') }) })
      latest().onmessage?.({ data: JSON.stringify({ nope: true }) })
      latest().onmessage?.({ data: 'not json' })
    })

    expect(onMessage).toHaveBeenCalledTimes(1)
    expect(onMessage).toHaveBeenCalledWith({ id: hex('a') })
  })

  it('reconnects with backoff after the server drops the socket', () => {
    renderHook(() => useThorSubscription({ path: 'block', schema: pendingTxSchema, onMessage: vi.fn() }))

    act(() => latest().onclose?.())
    expect(FakeSocket.instances).toHaveLength(1)
    act(() => vi.advanceTimersByTime(1_000))
    expect(FakeSocket.instances).toHaveLength(2)

    act(() => latest().onclose?.())
    act(() => vi.advanceTimersByTime(1_999))
    expect(FakeSocket.instances).toHaveLength(2)
    act(() => vi.advanceTimersByTime(1))
    expect(FakeSocket.instances).toHaveLength(3)
  })

  it('closes the socket on unmount without reconnecting', () => {
    const { unmount } = renderHook(() =>
      useThorSubscription({ path: 'block', schema: pendingTxSchema, onMessage: vi.fn() }),
    )

    unmount()
    expect(latest().closed).toBe(true)
    act(() => vi.advanceTimersByTime(60_000))
    expect(FakeSocket.instances).toHaveLength(1)
  })

  it('moves to the new node when the network changes', () => {
    renderHook(() => useThorSubscription({ path: 'block', schema: pendingTxSchema, onMessage: vi.fn() }))
    const first = latest()

    act(() => useSettingsStore.setState({ activeNetwork: NETWORKS[NetworkName.TESTNET] }))

    expect(first.closed).toBe(true)
    expect(latest().url).toBe(subscriptionUrl(NETWORKS[NetworkName.TESTNET].url, 'block'))
  })

  it('stays offline while disabled', () => {
    renderHook(() =>
      useThorSubscription({ path: 'block', schema: pendingTxSchema, onMessage: vi.fn(), enabled: false }),
    )
    expect(FakeSocket.instances).toHaveLength(0)
  })
})
