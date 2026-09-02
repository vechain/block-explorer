import { QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQueryClient } from '@/lib/query-client/query-client'
import { useSettingsStore } from '@/lib/stores/settings'
import { ChakraProvider } from '../theme/provider'
import { DevModeModal } from './DevModeModal'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

const STORED_NODE_URL = 'http://stored-node.test'
const STORED_INDEXER_URL = 'http://stored-indexer.test'

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider>
    <QueryClientProvider client={makeQueryClient()}>{children}</QueryClientProvider>
  </ChakraProvider>
)

const nodeInput = () => screen.getAllByRole('textbox')[0] as HTMLInputElement

beforeEach(() => {
  useSettingsStore.setState({ soloNodeUrl: STORED_NODE_URL, soloIndexerUrl: STORED_INDEXER_URL })
})

afterEach(cleanup)

describe('DevModeModal', () => {
  it('seeds the drafts from the stored URLs', () => {
    render(<DevModeModal isOpen onClose={vi.fn()} />, { wrapper })

    expect(nodeInput().value).toBe(STORED_NODE_URL)
  })

  it('discards an unsaved edit when reopened', () => {
    const { rerender } = render(<DevModeModal isOpen onClose={vi.fn()} />, { wrapper })

    fireEvent.change(nodeInput(), { target: { value: 'http://edited.test' } })
    expect(nodeInput().value).toBe('http://edited.test')

    rerender(<DevModeModal isOpen={false} onClose={vi.fn()} />)
    rerender(<DevModeModal isOpen onClose={vi.fn()} />)

    expect(nodeInput().value).toBe(STORED_NODE_URL)
  })

  it('saves a valid edit back to the store and closes', () => {
    const onClose = vi.fn()
    render(<DevModeModal isOpen onClose={onClose} />, { wrapper })

    fireEvent.change(nodeInput(), { target: { value: 'http://saved-node.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(useSettingsStore.getState().soloNodeUrl).toBe('http://saved-node.test')
    expect(onClose).toHaveBeenCalled()
  })
})
