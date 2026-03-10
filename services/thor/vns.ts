import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import { vnsUtils } from '@vechain/sdk-network'
import { NetworkName } from '@/lib/constants/network'
import { type AddressString, addressStringSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { isZeroAddress } from '@/lib/utils/address'
import { nameToVeworldVet, normalizeName } from '@/lib/utils/vns'
import { getThorClient } from './client'

const VNS_NAME_QUERY_KEY = 'getVnsName'

export const vnsNameQueryOptions = (networkName: NetworkName, address: AddressString | undefined) =>
  queryOptions({
    queryKey: [VNS_NAME_QUERY_KEY, networkName, address],
    queryFn: address ? () => getVnsName({ networkName, address }) : skipToken,
    staleTime: Infinity,
  })

const getVnsName = async ({
  networkName,
  address,
}: {
  networkName: NetworkName
  address: AddressString
}): Promise<string | null> => {
  const thorClient = getThorClient(networkName)
  const vnsName = await vnsUtils.lookupAddress(thorClient, address)

  if (!vnsName) {
    return null
  }

  return vnsName
}

const tryResolve = async (
  thorClient: ReturnType<typeof getThorClient>,
  vnsName: string,
): Promise<AddressString | null> => {
  const resolvedAddress = await vnsUtils.resolveName(thorClient, vnsName)
  if (!resolvedAddress) return null
  const address = addressStringSchema.parse(resolvedAddress)
  if (isZeroAddress(address)) return null
  return address
}

export const useVnsName = (address: AddressString | undefined) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(vnsNameQueryOptions(activeNetwork.name, address))
}

export const getVnsAddress = async ({
  networkName,
  name,
}: {
  networkName: NetworkName
  name: string
}): Promise<AddressString | null> => {
  const thorClient = getThorClient(networkName)
  const nameTrimmed = name.trim().toLowerCase()

  if (nameTrimmed.endsWith('.vet')) {
    return tryResolve(thorClient, normalizeName(name))
  }

  const withVet = await tryResolve(thorClient, normalizeName(name))
  if (withVet) return withVet

  return tryResolve(thorClient, nameToVeworldVet(name))
}
