import type { Query, QueryKey } from '@tanstack/react-query'
import { useSettingsStore } from '@/lib/stores/settings'
import { parseNetworkName } from '@/lib/utils/network'

const findNetworkName = (queryKey: QueryKey) => {
  for (const segment of queryKey) {
    if (typeof segment !== 'string') continue

    const networkName = parseNetworkName(segment)
    if (networkName) return networkName
  }

  return null
}

/**
 * `keepPreviousData`, restricted to the active network.
 *
 * Query keys are network-scoped, so reusing the previous key's data across a network switch
 * shows the old chain's data as real (`isPending`/`isLoading` are both false while placeholder
 * data is present). Reuse within one network — paging, filters, chart ranges — is unaffected.
 */
export const keepPreviousDataWithinNetwork = <TData>(
  previousData: TData | undefined,
  previousQuery: Query | undefined,
): TData | undefined => {
  if (!previousQuery) return undefined

  const previousNetworkName = findNetworkName(previousQuery.queryKey)
  const activeNetworkName = useSettingsStore.getState().activeNetwork.name

  if (previousNetworkName && previousNetworkName !== activeNetworkName) return undefined

  return previousData
}
