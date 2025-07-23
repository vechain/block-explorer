import { useLatestBlocks } from "@/services/thor/block/hooks"
import { useB3trRewardDistributedEvents } from "@/services/thor/events/hooks"

export function useClausesPerSecond({ numBlocks }: { numBlocks: number }) {
  const { data: blocks } = useLatestBlocks({ count: numBlocks + 1 })

  if (blocks.length < numBlocks + 1) {
    return 0
  }
  // Get the difference in time between the first and last block
  const timeDifference = blocks[0].timestamp - blocks[blocks.length - 1].timestamp

  // Get the total number of clauses in all but the last block
  const totalClauses = blocks
    .slice(0, -1)
    .reduce((total, block) => total + block.transactions.reduce((cl3, tx) => cl3 + tx.clauses.length, 0), 0)

  // Calculate the clauses per second
  return totalClauses / timeDifference
}

export function useTransactionsPerSecond({ numBlocks }: { numBlocks: number }) {
  const { data: blocks } = useLatestBlocks({ count: numBlocks + 1 })

  if (blocks.length < numBlocks + 1) {
    return 0
  }
  // Get the difference in time between the first and last block
  const timeDifference = blocks[0].timestamp - blocks[blocks.length - 1].timestamp

  // Get the total number of transactions in all but the last block
  const totalTransactions = blocks.slice(0, -1).reduce((total, block) => total + block.transactions.length, 0)

  // Calculate the transactions per second
  return totalTransactions / timeDifference
}

export function useActionsPerSecond({ numBlocks }: { numBlocks: number }) {
  const { data: actions } = useB3trRewardDistributedEvents({ numBlocks })

  if (!actions) {
    return 0
  }

  // Get the difference in time between the first and last block (estimated by num blocks)
  const timeDifference = numBlocks * 10

  // Get the total number of actions
  return actions.length / timeDifference
}
