import { describe, expect, it } from 'vitest'
import { getLocalePrefix, getRouteSegments } from './route-path'

describe('getRouteSegments', () => {
  it('drops a non-default locale prefix', () => {
    expect(getRouteSegments('/es/block/0xabc')).toEqual(['block', '0xabc'])
  })

  it('keeps every segment when the default locale is unprefixed', () => {
    expect(getRouteSegments('/nft/0xabc/42')).toEqual(['nft', '0xabc', '42'])
  })

  it('tolerates a trailing slash and the root path', () => {
    expect(getRouteSegments('/es/address/0xabc/')).toEqual(['address', '0xabc'])
    expect(getRouteSegments('/')).toEqual([])
  })
})

describe('getLocalePrefix', () => {
  it('returns the prefix for a non-default locale', () => {
    expect(getLocalePrefix('/es/transfers/nft')).toBe('/es')
  })

  it('returns nothing for the unprefixed default locale', () => {
    expect(getLocalePrefix('/transfers/nft')).toBe('')
    expect(getLocalePrefix('/')).toBe('')
  })

  it('does not mistake a route segment for a locale', () => {
    expect(getLocalePrefix('/tokens')).toBe('')
  })
})
