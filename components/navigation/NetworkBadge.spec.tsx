import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NETWORKS, NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { ChakraProvider } from '../theme/provider'
import { NetworkBadge } from './NetworkBadge'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

const renderBadge = (networkName: NetworkName) => {
  useSettingsStore.setState({ activeNetwork: NETWORKS[networkName] })
  return render(<NetworkBadge />, { wrapper: ChakraProvider })
}

afterEach(cleanup)

describe('NetworkBadge', () => {
  it('renders nothing on mainnet', () => {
    renderBadge(NetworkName.MAINNET)

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('names the network when off mainnet', () => {
    renderBadge(NetworkName.TESTNET)

    expect(screen.getByRole('status').textContent).toBe('Testnet')
  })

  it('labels the solo network', () => {
    renderBadge(NetworkName.SOLO)

    expect(screen.getByRole('status').textContent).toBe('Solo')
  })
})
