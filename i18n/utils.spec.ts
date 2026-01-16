import { describe, expect, it } from 'vitest'
import { Locale } from './config'
import { getLocalePath } from './utils'

describe('getLocalePath', () => {
  it('should replace existing locale in path', () => {
    expect(getLocalePath(Locale.FR, '/en/transaction/0x123')).toBe('/fr/transaction/0x123')
    expect(getLocalePath(Locale.ES, '/en/block/123')).toBe('/es/block/123')
    expect(getLocalePath(Locale.DE, '/fr/address/0x456')).toBe('/de/address/0x456')
  })

  it('should insert locale when path has no locale prefix', () => {
    expect(getLocalePath(Locale.FR, '/transaction/0x123')).toBe('/fr/transaction/0x123')
    expect(getLocalePath(Locale.ES, '/block/123')).toBe('/es/block/123')
    expect(getLocalePath(Locale.DE, '/address/0x456')).toBe('/de/address/0x456')
  })

  it('should handle homepage with locale', () => {
    expect(getLocalePath(Locale.FR, '/en')).toBe('/fr')
    expect(getLocalePath(Locale.ES, '/fr')).toBe('/es')
  })

  it('should handle homepage without locale', () => {
    expect(getLocalePath(Locale.FR, '/')).toBe('/fr/')
  })

  it('should handle deep paths with locale', () => {
    expect(getLocalePath(Locale.FR, '/en/address/0x123/transactions')).toBe('/fr/address/0x123/transactions')
  })

  it('should handle deep paths without locale', () => {
    expect(getLocalePath(Locale.FR, '/address/0x123/transactions')).toBe('/fr/address/0x123/transactions')
  })

  it('should handle all supported locales', () => {
    const locales = [
      Locale.EN,
      Locale.ES,
      Locale.FR,
      Locale.IT,
      Locale.JA,
      Locale.PT,
      Locale.RU,
      Locale.TR,
      Locale.DE,
      Locale.ZH,
      Locale.EL,
    ]

    locales.forEach(locale => {
      // With existing locale
      expect(getLocalePath(locale, '/en/transaction/0x123')).toBe(`/${locale}/transaction/0x123`)
      // Without locale
      expect(getLocalePath(locale, '/transaction/0x123')).toBe(`/${locale}/transaction/0x123`)
    })
  })
})
