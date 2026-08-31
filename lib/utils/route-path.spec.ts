import { describe, expect, it } from 'vitest'
import { getLocalePrefix } from './route-path'

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
