import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { zodParse } from './zod'

const schema = z.object({ id: z.string(), status: z.enum(['ACTIVE', 'EXITING']) })

const captureError = () => vi.spyOn(console, 'error').mockImplementation(() => undefined)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('zodParse', () => {
  it('returns parsed data and logs nothing on success', () => {
    const error = captureError()

    expect(zodParse({ data: { id: 'a', status: 'ACTIVE' }, schema })).toEqual({ id: 'a', status: 'ACTIVE' })
    expect(error).not.toHaveBeenCalled()
  })

  it('keeps the failure log off the payload', () => {
    const error = captureError()
    const secret = 'x'.repeat(5_000)

    zodParse({ data: { id: 'a', status: 'GONE', blob: secret }, schema, errorMessage: 'bad validator' })

    expect(error).toHaveBeenCalledTimes(1)
    const [logged] = error.mock.calls[0] as [string]
    expect(logged).toContain('bad validator')
    expect(logged).toContain('status')
    expect(logged).not.toContain(secret)
    expect(logged.length).toBeLessThan(1_000)
  })

  it('escapes the context, which callers build from on-chain strings', () => {
    const error = captureError()

    zodParse({ data: null, schema, errorMessage: 'Invalid NFT metadata at URI: ipfs://a\nforged log line' })

    const [logged] = error.mock.calls[0] as [string]
    expect(logged.split('\n')).toHaveLength(1)
    expect(logged).toContain('forged log line')
  })

  it('logs one line per failure regardless of how many issues there are', () => {
    const error = captureError()
    const many = z.array(schema)

    zodParse({ data: Array.from({ length: 200 }, (_, i) => ({ id: i })), schema: many })

    expect(error).toHaveBeenCalledTimes(1)
    const [logged] = error.mock.calls[0] as [string]
    expect(logged).toContain('"totalIssues":400')
    expect(logged.split('\n')).toHaveLength(1)
  })

  it('falls back when given a fallback, and to the raw data otherwise', () => {
    captureError()

    expect(zodParse({ data: null, schema, fallbackData: { id: 'z', status: 'ACTIVE' } })).toEqual({
      id: 'z',
      status: 'ACTIVE',
    })
    expect(zodParse({ data: { id: 1 }, schema })).toEqual({ id: 1 })
  })
})
