import { describe, expect, it } from 'vitest'
import { config } from '@/middleware'
import { GET } from './route'

const middlewareMatches = (pathname: string) => new RegExp(`^${config.matcher}$`).test(pathname)

describe('GET /api/health', () => {
  it('answers a bare 200 so an ALB target group with the default matcher goes healthy', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('is never cached', async () => {
    expect((await GET()).headers.get('Cache-Control')).toBe('no-store')
  })

  it('bypasses the i18n middleware that would otherwise redirect it', () => {
    expect(middlewareMatches('/api/health')).toBe(false)
    expect(middlewareMatches('/')).toBe(true)
  })
})
