import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChakraProvider } from '../theme/provider'
import { type Column, DataTable, type TableRow } from './Table'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const columns: Column[] = [{ key: 'name', label: 'Name' }]

const rowsOf = (...ids: string[]): TableRow[] => ids.map(id => ({ id, name: id }))

// The fade-in is an emotion class, and so is the odd/even row stripe — so a
// highlighted row only reads as different against a sibling of the same parity.
const classOf = (id: string) =>
  screen
    .getAllByRole('row')
    .slice(1)
    .find(r => r.textContent?.includes(id))?.className ?? ''

afterEach(cleanup)

describe('DataTable new-row highlight', () => {
  it('highlights nothing on first paint', () => {
    render(<DataTable columns={columns} rows={rowsOf('a', 'b', 'c')} />, { wrapper: ChakraProvider })

    expect(classOf('c')).toBe(classOf('a'))
  })

  it('highlights a row that arrived since the last render', () => {
    const { rerender } = render(<DataTable columns={columns} rows={rowsOf('a', 'b')} />, { wrapper: ChakraProvider })

    rerender(<DataTable columns={columns} rows={rowsOf('a', 'b', 'c')} />)

    expect(classOf('c')).not.toBe(classOf('a'))
  })

  it('stops highlighting a row once it has been seen', () => {
    const { rerender } = render(<DataTable columns={columns} rows={rowsOf('a', 'b')} />, { wrapper: ChakraProvider })

    rerender(<DataTable columns={columns} rows={rowsOf('a', 'b', 'c')} />)
    rerender(<DataTable columns={columns} rows={rowsOf('a', 'b', 'c', 'd')} />)

    expect(classOf('c')).toBe(classOf('a'))
    expect(classOf('d')).not.toBe(classOf('b'))
  })

  it('leaves rows alone when the same list is re-rendered', () => {
    const { rerender } = render(<DataTable columns={columns} rows={rowsOf('a', 'b', 'c')} />, {
      wrapper: ChakraProvider,
    })

    rerender(<DataTable columns={columns} rows={rowsOf('a', 'b', 'c')} />)

    expect(classOf('c')).toBe(classOf('a'))
  })
})
