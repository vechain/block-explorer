import { Address } from "@vechain/sdk-core"
import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { VNS_ADDRESS_KEY, VNS_NAME_KEY } from "@/constants/QueryKeys.ts"
import { VNS_FUNCTION_ABI_GET_ADDRESSES, VNS_FUNCTION_ABI_GET_NAMES, VNS_RESOLVER } from "@/constants/vns/VnsConst.ts"
import { isZeroAddress, normalizeName } from "@/utils/vns/VnsUtils.ts"

type UseVnsQuery = {
  getVnsName: (address: Address) => Promise<string | null>
  getVnsAddress: (name: string) => Promise<Address | null>
}

export const useVnsQuery = (): UseVnsQuery => {
  const { thorClient, selectedNetwork } = useNetwork()
  const queryClient = useQueryClient()

  const getVnsName = useCallback(
    async (address: Address): Promise<string | null> => {
      const cachedName = queryClient.getQueryData([VNS_NAME_KEY, selectedNetwork.name, address.toString()])
      if (cachedName) return cachedName as string
      const contractAddress = VNS_RESOLVER[selectedNetwork.name]
      if (!contractAddress) return null

      const result = await thorClient.contracts.executeCall(contractAddress, VNS_FUNCTION_ABI_GET_NAMES, [
        [address.toString()],
      ])

      if (!result.success || !result.result.array || result.result.array.length === 0) return null
      const name = result.result.array[0] as string

      queryClient.setQueryData([VNS_NAME_KEY, selectedNetwork.name, address.toString()], name)
      return name
    },
    [selectedNetwork, thorClient, queryClient],
  )

  const getVnsAddress = useCallback(
    async (name: string): Promise<Address | null> => {
      const normalizedName = normalizeName(name)
      const cachedAddress = queryClient.getQueryData([VNS_ADDRESS_KEY, selectedNetwork.name, normalizedName])
      if (cachedAddress) return cachedAddress as Address
      const contractAddress = VNS_RESOLVER[selectedNetwork.name]
      if (!contractAddress) return null

      let address: Address | null = null
      try {
        const result = await thorClient.contracts.executeCall(contractAddress, VNS_FUNCTION_ABI_GET_ADDRESSES, [
          [normalizedName],
        ])

        if (!result.success || !result.result.array || result.result.array.length === 0) return null
        address = result.result.array[0] as Address

        if (isZeroAddress(address)) return null

        queryClient.setQueryData([VNS_ADDRESS_KEY, selectedNetwork.name, normalizedName], address)
      } catch (error) {
        console.error("Failed to fetch vns address", error)
        return null
      }
      return address
    },
    [selectedNetwork, thorClient, queryClient],
  )

  return {
    getVnsName,
    getVnsAddress,
  }
}
