import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockUsePathname } = vi.hoisted(() => ({ mockUsePathname: vi.fn() }))

vi.mock('next/navigation', () => ({ usePathname: mockUsePathname }))

vi.mock('@/components/error/NotFound', () => ({
  NotFound: ({ title }: { title: string }) => <div data-testid="not-found">{title}</div>,
}))

vi.mock('./AddressPageContent', () => ({
  AddressPageContent: ({ address }: { address: string }) => <div data-testid="address-content">{address}</div>,
}))

import { AddressRoute } from './AddressRoute'

const ADDRESS = `0x${'b'.repeat(40)}`

const renderAt = (pathname: string) => {
  mockUsePathname.mockReturnValue(pathname)
  render(<AddressRoute />)
}

afterEach(cleanup)

describe('AddressRoute', () => {
  it('reads the address past a locale prefix', () => {
    renderAt(`/es/address/${ADDRESS}`)

    expect(screen.getByTestId('address-content').textContent).toBe(ADDRESS)
  })

  it('renders not found for a malformed address', () => {
    renderAt('/address/nonsense')

    expect(screen.getByTestId('not-found')).toBeDefined()
  })
})
