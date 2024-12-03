import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { BLOCK_CACHE_KEY } from "@/constants/QueryKeys.ts"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { Revisions } from "@/constants/blocks/Revisions.ts"

type UseBlockQuery = {
  getBlock: (revision: string | number) => Promise<ExpandedBlockDetail | null>
}

export const useBlockQuery = (): UseBlockQuery => {
  const { thorClient, selectedNetwork } = useNetwork()
  const queryClient = useQueryClient()

  const getBlock = useCallback(
    async (revision: string | number): Promise<ExpandedBlockDetail | null> => {
      let block: ExpandedBlockDetail | null = null

      try {
        // Determine the type of revision and handle accordingly
        // If the revision is best, justified or finalised then don't use the cache
        if (typeof revision === "string" && Revisions.includes(revision.trim().toLowerCase())) {
          block = await thorClient.blocks.getBlockExpanded(revision)
        } else {
          // Check the cache for the block
          const cachedBlock = queryClient.getQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, revision])
          if (cachedBlock) return cachedBlock as ExpandedBlockDetail

          // Fetch the block from the network
          block = await thorClient.blocks.getBlockExpanded(revision)
        }
        if (!block) return null

        // Update the cache with the block (store by both number and id)
        queryClient.setQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, block.number], block)
        queryClient.setQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, block.id], block)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // No need to log as errors are expected
        // console.error("Failed to fetch block", error)
      }
      return block
    },
    [thorClient, queryClient, selectedNetwork],
  )

  return {
    getBlock,
  }
}
