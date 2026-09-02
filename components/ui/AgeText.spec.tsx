import { cleanup, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChakraProvider } from '../theme/provider'
import { AgeText } from './AgeText'

vi.mock('@/hooks/useLocale', () => ({ useLocale: () => 'en' }))

const NOW = 1_700_000_000_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('AgeText', () => {
  it('renders the age on first paint without waiting for a tick', () => {
    render(<AgeText timestamp={NOW - 5_000} />, { wrapper: ChakraProvider })

    expect(screen.getByText('5s ago')).toBeTruthy()
  })

  it('re-renders as the clock advances', () => {
    render(<AgeText timestamp={NOW - 58_000} />, { wrapper: ChakraProvider })
    expect(screen.getByText('58s ago')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(4_000)
    })

    expect(screen.getByText('1m ago')).toBeTruthy()
  })

  it('follows a changed timestamp', () => {
    const { rerender } = render(<AgeText timestamp={NOW - 60_000} />, { wrapper: ChakraProvider })
    expect(screen.getByText('1m ago')).toBeTruthy()

    rerender(<AgeText timestamp={NOW - 7_200_000} />)

    expect(screen.getByText('2h ago')).toBeTruthy()
  })
})
