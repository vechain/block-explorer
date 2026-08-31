import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RuntimeConfigProvider } from './provider'
import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG_URL, RUNTIME_CONFIG_WINDOW_KEY, type RuntimeConfig } from './types'

const CONFIG: RuntimeConfig = {
  ...DEFAULT_RUNTIME_CONFIG,
  appVersion: '1.2.3',
  allowDevMode: true,
  soloContracts: { b3tr: '0x0000000000000000000000000000000000000001' },
}

const jsonResponse = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) })

const stubFetch = (respond: () => Promise<unknown>) => vi.stubGlobal('fetch', vi.fn(respond))

const renderProvider = () =>
  render(
    <RuntimeConfigProvider>
      <div data-testid="child" />
    </RuntimeConfigProvider>,
  )

const publishedConfig = () =>
  (window as unknown as Record<string, RuntimeConfig | undefined>)[RUNTIME_CONFIG_WINDOW_KEY]

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Reflect.deleteProperty(window, RUNTIME_CONFIG_WINDOW_KEY)
})

describe('RuntimeConfigProvider', () => {
  it('publishes the fetched config before rendering children', async () => {
    stubFetch(() => jsonResponse(CONFIG))

    renderProvider()

    expect(screen.queryByTestId('child')).toBeNull()
    await waitFor(() => expect(screen.queryByTestId('child')).not.toBeNull())
    expect(publishedConfig()).toEqual(CONFIG)
    expect(fetch).toHaveBeenCalledWith(RUNTIME_CONFIG_URL, { cache: 'no-store' })
  })

  it.each([
    ['the request fails', () => Promise.reject(new Error('offline'))],
    ['the response is not ok', () => Promise.resolve({ ok: false, status: 502 })],
    ['the payload does not match the schema', () => jsonResponse({ appVersion: 7 })],
  ])('falls back to defaults when %s', async (_case, respond) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    stubFetch(respond)

    renderProvider()

    await waitFor(() => expect(screen.queryByTestId('child')).not.toBeNull())
    expect(publishedConfig()).toEqual(DEFAULT_RUNTIME_CONFIG)
  })

  // During a rolling deploy the payload comes from a container built before the field
  // existed, and discarding the whole config over it would take dev mode down with it.
  it('defaults a field the serving container does not know about', async () => {
    const { b32Url: _omitted, ...withoutB32Url } = CONFIG
    stubFetch(() => jsonResponse(withoutB32Url))

    renderProvider()

    await waitFor(() => expect(screen.queryByTestId('child')).not.toBeNull())
    expect(publishedConfig()).toEqual(CONFIG)
  })
})
