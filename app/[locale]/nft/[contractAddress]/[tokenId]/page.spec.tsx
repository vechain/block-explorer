import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockUsePathname } = vi.hoisted(() => ({ mockUsePathname: vi.fn() }))

vi.mock('next/navigation', () => ({ usePathname: mockUsePathname }))

vi.mock('@/components/error/NotFound', () => ({
  NotFound: ({ title }: { title: string }) => <div data-testid="not-found">{title}</div>,
}))

vi.mock('./components/NftDetailPageContent', () => ({
  NftDetailPageContent: ({ contractAddress, tokenId }: { contractAddress: string; tokenId: bigint }) => (
    <div data-testid="nft-content">{`${contractAddress}/${tokenId}`}</div>
  ),
}))

import NftDetailPage from './page'

const CONTRACT = `0x${'c'.repeat(40)}`

const renderAt = (pathname: string) => {
  mockUsePathname.mockReturnValue(pathname)
  render(<NftDetailPage />)
}

afterEach(cleanup)

describe('NftDetailPage', () => {
  it('reads both segments past a locale prefix', () => {
    renderAt(`/es/nft/${CONTRACT}/42`)

    expect(screen.getByTestId('nft-content').textContent).toBe(`${CONTRACT}/42`)
  })

  it.each([
    ['a malformed contract address', `/nft/nonsense/42`],
    ['a non-numeric token id', `/nft/${CONTRACT}/abc`],
  ])('renders not found for %s', (_case, pathname) => {
    renderAt(pathname)

    expect(screen.getByTestId('not-found')).toBeDefined()
  })
})
