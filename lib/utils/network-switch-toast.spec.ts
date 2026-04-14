import type { TFunction } from 'i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toaster } from '@/components/ui/toaster'
import { NetworkName } from '@/lib/constants/network'
import { showAutomaticNetworkSwitchToast } from './network-switch-toast'

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}))

const t = ((key: string, options?: Record<string, string>) => {
  if (!options) return key

  return key.replaceAll('{{from}}', options.from ?? '').replaceAll('{{to}}', options.to ?? '')
}) as TFunction

describe('showAutomaticNetworkSwitchToast', () => {
  const mockCreate = vi.mocked(toaster.create)

  beforeEach(() => {
    mockCreate.mockClear()
  })

  it('schedules the toast outside the current lifecycle turn', async () => {
    showAutomaticNetworkSwitchToast({
      t,
      fromNetworkName: NetworkName.TESTNET,
      toNetworkName: NetworkName.MAINNET,
    })

    expect(mockCreate).not.toHaveBeenCalled()

    await Promise.resolve()

    expect(mockCreate).toHaveBeenCalledWith({
      type: 'warning',
      closable: true,
      title: 'Network switched automatically',
      description: 'The requested data was found on Mainnet. The explorer switched from Testnet to Mainnet.',
    })
  })

  it('does nothing when the network does not change', async () => {
    showAutomaticNetworkSwitchToast({
      t,
      fromNetworkName: NetworkName.MAINNET,
      toNetworkName: NetworkName.MAINNET,
    })

    await Promise.resolve()

    expect(mockCreate).not.toHaveBeenCalled()
  })
})
