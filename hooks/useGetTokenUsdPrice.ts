import { useSuspenseQuery } from '@tanstack/react-query'
import { BigNumber } from 'bignumber.js'
import { ThorClient } from '@vechain/sdk-network'
import { OracleVechainEnergy__factory } from '@vechain/vechain-contract-types'
import { useSettingsStore } from '@/lib/stores/settings'
import { NetworkName } from '@/lib/constants/network'
import { getThorClient } from '@/services/thor/client'

// Create an enum or object for supported price feed IDs
export const PRICE_FEED_IDS = {
  B3TR: '0x623374722d757364000000000000000000000000000000000000000000000000',
  VET: '0x7665742d75736400000000000000000000000000000000000000000000000000',
  VTHO: '0x7674686f2d757364000000000000000000000000000000000000000000000000',
  GBP: '0x6762702d75736400000000000000000000000000000000000000000000000000',
  EUR: '0x657572742d757364000000000000000000000000000000000000000000000000',
} as const

const ORACLE_CONTRACT_ADDRESS = {
  [NetworkName.MAINNET]: '0x49eC7192BF804Abc289645ca86F1eD01a6C17713',
  [NetworkName.TESTNET]: '0xdcCAaBd81B38e0dEEf4c202bC7F1261A4D9192C6',
}

export type SupportedToken = keyof typeof PRICE_FEED_IDS

// Rename and make the function generic
export const getTokenUsdPrice = async (
  thor: ThorClient,
  token: SupportedToken,
  network: NetworkName,
): Promise<number> => {
  const res = await thor.contracts
    .load(ORACLE_CONTRACT_ADDRESS[network], OracleVechainEnergy__factory.abi)
    .read.getLatestValue(PRICE_FEED_IDS[token])

  if (!res) throw new Error(`Failed to get price of ${token}`)

  return new BigNumber(res[0].toString()).div(1e12).toNumber() as number
}

export const getTokenUsdPriceQueryKey = (token: SupportedToken) => ['VECHAIN_KIT_PRICE', token]

export const useGetTokenUsdPrice = (token: SupportedToken) => {
  const { activeNetwork } = useSettingsStore()
  const thor = getThorClient(activeNetwork.name)

  return useSuspenseQuery({
    queryKey: getTokenUsdPriceQueryKey(token),
    queryFn: async () => getTokenUsdPrice(thor, token, activeNetwork.name),
    retry: (failureCount, error) => {
      // Don't retry on cancellation errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes('cancel') || errorMessage.includes('abort')) {
          return false
        }
      }
      // Retry network errors up to 2 times
      return failureCount < 2
    },
    gcTime: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60, // 1 minute
  })
}
