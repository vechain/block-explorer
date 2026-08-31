import { queryOptions, useQuery } from '@tanstack/react-query'
import { BLOCK_TIME_MS, type NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { indexerFetch } from './index'
import { type IndexerGetTransfersParams, indexerResponseSchema, indexerTransferSchema } from './schemas'

const ACCOUNT_TRANSFERS_QUERY_KEY = 'getAccountTransfers'

const accountTransfersQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetTransfersParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [ACCOUNT_TRANSFERS_QUERY_KEY, networkName, params] as const,
    queryFn: () => getAccountTransfers({ networkName, params }),
    staleTime: BLOCK_TIME_MS,
    enabled: options?.enabled ?? true,
  })

export const useAccountTransfers = ({
  params,
  enabled = true,
}: {
  params: IndexerGetTransfersParams
  enabled?: boolean
}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTransfersQueryOptions(activeNetwork.name, params, { enabled }))
}

const getAccountTransfers = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetTransfersParams
}) => {
  const { data } = await indexerFetch({
    networkName,
    endPoint: '/transfers',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransferSchema),
    errorMessage: 'Invalid transfers response from VeWorld Indexer',
  })
}
