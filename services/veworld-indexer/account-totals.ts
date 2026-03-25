import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { IndexerVersion, indexerGet, resolveUrl } from '.'

const ACCOUNT_TOTAL_QUERY_KEY = 'getAccountTotal'

const accountTotalResponseSchema = z.number()

export const accountTotalQueryOptions = (networkName: NetworkName) => ({
  queryKey: [ACCOUNT_TOTAL_QUERY_KEY, networkName],
  queryFn: () => getAccountTotal(networkName),
  refetchInterval: 10 * 1000,
  placeholderData: keepPreviousData,
})

export const useAccountTotal = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTotalQueryOptions(activeNetwork.name))
}

const getAccountTotal = async (networkName: NetworkName) => {
  const { data } = await indexerGet({
    baseUrl: resolveUrl(networkName, IndexerVersion.V2),
    endPoint: '/accounts/total',
  })
  return zodParse({
    data,
    schema: accountTotalResponseSchema,
    errorMessage: 'Invalid account total response from VeWorld Indexer',
  })
}
