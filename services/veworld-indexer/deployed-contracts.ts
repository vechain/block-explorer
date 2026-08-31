import { useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerFetch } from '.'
import { indexerContractSchema, indexerResponseSchema } from './schemas'

const DEPLOYED_CONTRACTS_QUERY_KEY = 'getContractsByMaster'

interface DeployedContractsParams {
  address: AddressString
  page?: number
  size?: number
}

const deployedContractsQueryOptions = (networkName: NetworkName, params: DeployedContractsParams) => ({
  queryKey: [DEPLOYED_CONTRACTS_QUERY_KEY, networkName, params],
  queryFn: () => getContractsByMaster({ networkName, params }),
})

export const useDeployedContracts = ({
  address,
  page,
  size,
}: {
  address: AddressString
  page?: number
  size?: number
}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(deployedContractsQueryOptions(activeNetwork.name, { address, page, size }))
}

const getContractsByMaster = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: DeployedContractsParams
}) => {
  const queryParams: Record<string, string> = {}
  if (params.page !== undefined) queryParams.page = String(params.page)
  if (params.size !== undefined) queryParams.size = String(params.size)

  const { data } = await indexerFetch({
    networkName,
    endPoint: `/contracts/by-master/${params.address}`,
    params: queryParams,
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerContractSchema),
    errorMessage: 'Invalid deployed contracts response from VeWorld Indexer',
  })
}
