import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ValidatorMetadata } from '@/services/veworld-indexer/validator-details'
import { toMetadataLookup } from '@/services/veworld-indexer/validator-metadata'
import { ChakraProvider } from '../theme/provider'
import { ValidatorLink } from './ValidatorLink'

const KEYROCK = '0x1F66de57049FFd2cbC85d7A7ba5d1d76d6937678' as const
const UNKNOWN = '0x239fe069335df7c4201ce53ca3e64cb33f780d65' as const

const hub: ValidatorMetadata[] = [
  { address: KEYROCK, name: 'Keyrock', location: 'Belgium', desc: '', logo: 'https://hub.test/keyrock.png' },
]

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/services/thor/vns', () => ({ useVnsName: () => ({ data: undefined, isPending: false }) }))
vi.mock('@/services/veworld-indexer/validator-metadata', async importOriginal => ({
  ...(await importOriginal<typeof import('@/services/veworld-indexer/validator-metadata')>()),
  useValidatorMetadataLookup: () => {
    const lookup = toMetadataLookup(hub)
    return (address: string) => lookup.get(address.toLowerCase())
  },
}))

afterEach(cleanup)

describe('ValidatorLink', () => {
  it('shows the registered name and logo for a known validator', () => {
    const { container } = render(<ValidatorLink address={KEYROCK.toLowerCase() as typeof KEYROCK} />, {
      wrapper: ChakraProvider,
    })

    expect(screen.getByRole('link', { name: /Keyrock/ }).getAttribute('href')).toContain(KEYROCK.toLowerCase())
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://hub.test/keyrock.png')
  })

  it('falls back to the truncated address for a validator with no metadata', () => {
    const { container } = render(<ValidatorLink address={UNKNOWN} />, { wrapper: ChakraProvider })

    expect(screen.getByRole('link').textContent).toMatch(/^0x239f.*0d65$/)
    expect(container.querySelector('img')).toBeNull()
  })
})

describe('toMetadataLookup', () => {
  it('keys entries by lower-cased address', () => {
    const lookup = toMetadataLookup(hub)
    expect(lookup.get(KEYROCK.toLowerCase())?.name).toBe('Keyrock')
    expect(lookup.get(KEYROCK)).toBeUndefined()
  })
})
