import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import * as React from 'react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecentBlocksCompressed, useRecentBlocksExpanded } from './recent-activity'
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const HEAD = 1_000_000

const hex = (length: number, seed = 'a') => `0x${seed.repeat(length)}`

const block = (number: number) => ({
  number,
  id: hex(64, 'a'),
  parentID: hex(64, 'b'),
  timestamp: 1_700_000_000,
  size: 361,
  isFinalized: false,
  isTrunk: true,
  com: true,
  transactions: [],
  gasUsed: 21_000,
  gasLimit: 30_000_000,
  signer: hex(40, 'c'),
  beneficiary: hex(40, 'd'),
  txsRoot: hex(64, 'e'),
  stateRoot: hex(64, 'f'),
  receiptsRoot: hex(64, '1'),
  totalScore: number,
})

let requested: { best: number; revisions: number[] }
let headResolvers: Array<(value: unknown) => void>
let holdHead: boolean

// Serves the `/api/thor` proxy the block service now calls, so the whole client path is
// exercised — including which revisions it decides to ask for.
const installFetch = () => {
  requested = { best: 0, revisions: [] }
  headResolvers = []
  holdHead = false

  vi.stubGlobal(
    'fetch',
    vi.fn((input: string) => {
      const url = new URL(String(input), 'http://localhost')
      const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

      if (url.pathname === '/api/thor/blocks/best') {
        requested.best++
        if (holdHead) return new Promise(resolve => headResolvers.push(() => resolve(json(block(HEAD)))))
        return Promise.resolve(json(block(HEAD)))
      }

      requested.revisions.push(Number(url.searchParams.get('revision')))
      return Promise.resolve(json(block(Number(url.searchParams.get('revision')))))
    }),
  )
}

const makeClient = () =>
  new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 0, placeholderData: keepPreviousData } },
  })

const settle = async () => {
  for (let i = 0; i < 40; i++) await act(async () => await vi.advanceTimersByTimeAsync(1))
}

const renderHook = (hook: () => unknown) => {
  const client = makeClient()
  let latest: unknown
  const Probe = () => {
    latest = hook()
    return null
  }
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  )
  return () => latest as { data: unknown[]; isPending: boolean }
}

describe('recent block windows', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installFetch()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('fetches nothing until the head is known, rather than counting up from genesis', async () => {
    holdHead = true
    const result = renderHook(() => useRecentBlocksCompressed({ count: 5 }))
    await settle()

    expect(requested.revisions).toEqual([])
    // Still loading, so the caller shows a skeleton rather than an empty state.
    expect(result().isPending).toBe(true)

    holdHead = false
    await act(async () => {
      headResolvers.forEach(resolve => resolve(undefined))
    })
    await settle()

    expect(requested.revisions.sort((a, b) => a - b)).toEqual([999_996, 999_997, 999_998, 999_999, 1_000_000])
    expect(result().isPending).toBe(false)
  })

  it('asks only for blocks inside the window it renders', async () => {
    renderHook(() => useRecentBlocksExpanded({ count: 20 }))
    await settle()

    expect(requested.revisions).toHaveLength(20)
    expect(Math.min(...requested.revisions)).toBe(HEAD - 19)
    expect(Math.max(...requested.revisions)).toBe(HEAD)
  })

  it('widens straight to a larger page size instead of stepping ten blocks per render', async () => {
    let setCount: (count: number) => void = () => {}
    const Probe = () => {
      const [count, set] = React.useState(20)
      setCount = set
      useRecentBlocksExpanded({ count })
      return null
    }
    render(
      <QueryClientProvider client={makeClient()}>
        <Probe />
      </QueryClientProvider>,
    )
    await settle()

    await act(async () => setCount(100))
    await settle()

    expect(requested.revisions).toHaveLength(100)
    expect(new Set(requested.revisions).size).toBe(100)
  })
})
