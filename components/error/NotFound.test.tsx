import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ChakraProvider } from '../theme/provider'
import { NotFound } from './NotFound'

test('Page', () => {
  render(<NotFound />, { wrapper: ChakraProvider })
  expect(screen.getByText('This page does not exist')).toBeDefined()
  const link = screen.getByRole('link', { name: 'Back to dashboard' })
  expect(link).toBeDefined()
  expect(link.getAttribute('href')).toBe('/')
})
