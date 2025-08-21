import { useLatestBlocks } from "@/services/thor/block/hooks"
import { useB3trRewardDistributedEvents } from "@/services/thor/events/hooks"
import { ExpandedBlockDetail } from "@vechain/sdk-network"

export const useClausesPerSecond = ({ numBlocks }: { numBlocks: number }) => {
  const { data: blocks, ...rest } = useLatestBlocks({ count: numBlocks + 1 })

  if (blocks.length < numBlocks + 1) {
    return { data: 0, ...rest }
  }

  // Get the total number of clauses in all but the last block
  const totalClauses = blocks
    .slice(0, -1)
    .reduce((total, block) => total + block.transactions.reduce((acc, tx) => acc + tx.clauses.length, 0), 0)

  const clausesPerSecond = totalClauses / getTimeDifference(blocks)

  return { data: clausesPerSecond, ...rest }
}

export const useTransactionsPerSecond = ({ numBlocks }: { numBlocks: number }) => {
  const { data: blocks, ...rest } = useLatestBlocks({ count: numBlocks + 1 })

  if (blocks.length < numBlocks + 1) {
    return { data: 0, ...rest }
  }

  // Get the total number of transactions in all but the last block
  const totalTransactions = blocks.slice(0, -1).reduce((total, block) => total + block.transactions.length, 0)

  const txPerSecond = totalTransactions / getTimeDifference(blocks)

  return { data: txPerSecond, ...rest }
}

export const useRewardDistributedPerSecond = ({ numBlocks }: { numBlocks: number }) => {
  const { data: blocks } = useLatestBlocks({ count: numBlocks + 1 })
  const { data: actions, ...rest } = useB3trRewardDistributedEvents({ numBlocks: numBlocks + 1 })

  if (!actions || !blocks || blocks.length < numBlocks + 1) {
    return { data: 0, ...rest }
  }

  const actionsPerSecond = actions.length / getTimeDifference(blocks)

  return { data: actionsPerSecond, ...rest }
}

const getTimeDifference = (blocks: ExpandedBlockDetail[]) => {
  return blocks[0].timestamp - blocks[blocks.length - 1].timestamp
}
