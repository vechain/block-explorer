import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl, IndexerVersion } from '.'
import { indexerResponseSchema, tokenHistorySchema } from './schemas'
import { ZERO_ADDRESS } from '@vechain/sdk-core'

const TOKEN_HISTORY_QUERY_KEY = 'getTokenHistory'

interface TokenHistoryParams {
  tokenId: string
  contractAddress?: AddressString
  eventName?: string[]
  page?: number
  size?: number
  direction?: 'ASC' | 'DESC'
}

const getTokenHistory = async (networkName: NetworkName, params: TokenHistoryParams) => {
  const { tokenId, contractAddress, eventName, page, size, direction } = params

  const searchParams = new URLSearchParams()
  if (contractAddress) searchParams.set('contractAddress', contractAddress)
  if (eventName?.length) eventName.forEach(e => searchParams.append('eventName', e))
  if (page !== undefined) searchParams.set('page', String(page))
  if (size !== undefined) searchParams.set('size', String(size))
  if (direction) searchParams.set('direction', direction)

  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName, IndexerVersion.V2),
    endPoint: `/history/token/${tokenId}`,
    params: Object.fromEntries(searchParams),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(tokenHistorySchema),
    errorMessage: 'Invalid token history response from VeWorld Indexer',
  })
}

export const useNftTransfers = ({
  contractAddress,
  tokenId,
  page = 0,
  size = 20,
  direction = 'DESC',
}: {
  contractAddress: AddressString
  tokenId: bigint
  page?: number
  size?: number
  direction?: 'ASC' | 'DESC'
}) => {
  const { activeNetwork } = useSettingsStore()

  return useQuery({
    queryKey: [TOKEN_HISTORY_QUERY_KEY, activeNetwork.name, contractAddress, tokenId.toString(), page, size],
    queryFn: () =>
      getTokenHistory(activeNetwork.name, {
        tokenId: tokenId.toString(),
        contractAddress,
        page,
        size,
        direction,
      }),
  })
}

export const useMintEvent = ({ contractAddress, tokenId }: { contractAddress: AddressString; tokenId: bigint }) => {
  const { data: transfersData, isPending } = useNftTransfers({
    contractAddress,
    tokenId,
    size: 1,
    direction: 'ASC',
  })

  const mintEvent = transfersData?.data.find(transfer => transfer.from.toLowerCase() === ZERO_ADDRESS.toLowerCase())

  return {
    mintEvent,
    isLoading: isPending,
  }
}
