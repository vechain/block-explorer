import { afterEach, describe, expect, it, vi } from 'vitest'
import { readRuntimeConfigFromEnv } from './from-env'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('readRuntimeConfigFromEnv', () => {
  it('reads the container env the browser fetches it for', () => {
    vi.stubEnv('APP_VERSION', ' 1.2.3 ')
    vi.stubEnv('ALLOW_DEV_MODE', 'true')
    vi.stubEnv('SOLO_B3TR_ADDRESS', '0x0000000000000000000000000000000000000001')

    expect(readRuntimeConfigFromEnv()).toMatchObject({
      appVersion: '1.2.3',
      allowDevMode: true,
      soloContracts: { b3tr: '0x0000000000000000000000000000000000000001' },
    })
  })

  it('drops a solo address that is not one', () => {
    vi.stubEnv('SOLO_VOT3_ADDRESS', 'not-an-address')

    expect(readRuntimeConfigFromEnv().soloContracts.vot3).toBeUndefined()
  })

  it('falls back to a dev version and no dev mode outside development', () => {
    vi.stubEnv('APP_VERSION', '')
    vi.stubEnv('NODE_ENV', 'production')

    expect(readRuntimeConfigFromEnv()).toMatchObject({ appVersion: 'dev', allowDevMode: false })
  })
})
