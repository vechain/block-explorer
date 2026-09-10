import type { TFunction } from 'i18next'
import { NetworkName } from '@/lib/constants/network'

export const getNetworkLabel = (t: TFunction, networkName: NetworkName) => {
  switch (networkName) {
    case NetworkName.MAINNET:
      return t('Mainnet')
    case NetworkName.TESTNET:
      return t('Testnet')
    case NetworkName.SOLO:
      return t('Solo')
  }
}
