import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockUsePathname } = vi.hoisted(() => ({ mockUsePathname: vi.fn() }))

vi.mock('next/navigation', () => ({ usePathname: mockUsePathname }))

vi.mock('@/components/error/NotFound', () => ({
  NotFound: ({ title }: { title: string }) => <div data-testid="not-found">{title}</div>,
}))

vi.mock('./BlockDetails', () => ({
  BlockDetails: ({ blockId }: { blockId: unknown }) => <div data-testid="block-details">{String(blockId)}</div>,
}))

import { BlockRoute } from './BlockRoute'

const renderAt = (pathname: string) => {
  mockUsePathname.mockReturnValue(pathname)
  render(<BlockRoute />)
}

afterEach(cleanup)

describe('BlockRoute', () => {
  it('coerces a block number from the path', () => {
    renderAt('/block/12345678')

    expect(screen.getByTestId('block-details').textContent).toBe('12345678')
  })

  it('reads the block id past a locale prefix', () => {
    const blockId = `0x${'a'.repeat(64)}`
    renderAt(`/es/block/${blockId}`)

    expect(screen.getByTestId('block-details').textContent).toBe(blockId)
  })

  it('renders not found for a malformed revision', () => {
    renderAt('/block/not-a-block')

    expect(screen.getByTestId('not-found')).toBeDefined()
  })
})
