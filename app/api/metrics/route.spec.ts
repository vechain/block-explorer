import { afterEach, describe, expect, it, vi } from 'vitest'

const importRoute = async () => {
  vi.resetModules()
  const { GET } = await import('./route')
  return GET
}

describe('GET /api/metrics', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is not exposed unless explicitly enabled', async () => {
    vi.stubEnv('METRICS_ENABLED', '')
    vi.stubEnv('NODE_ENV', 'production')

    expect((await (await importRoute())()).status).toBe(404)
  })

  it('serves the registry in the Prometheus text format when enabled', async () => {
    vi.stubEnv('METRICS_ENABLED', 'true')

    const response = await (await importRoute())()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/plain')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toContain('# HELP process_cpu_seconds_total')
  })
})
