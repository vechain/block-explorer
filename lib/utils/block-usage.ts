import type { BlockUsageData } from '@/lib/schemas'

export type CumulativeDataPoint = {
  gasUsed: number
  gasLimit: number
  numTransactions: number
  usagePercentage: number
  timestamp: number
  startTimestamp: number
}

/**
 * Transforms cumulative block usage data to period totals for bar chart display
 *
 * Unlike transformBlockUsageData which calculates per-block averages,
 * this function returns the total cumulated values between consecutive
 * data points — suitable for bar charts showing period totals.
 */
export const transformBlockUsageCumulativeData = (cumulativeData: BlockUsageData[]): CumulativeDataPoint[] => {
  if (cumulativeData.length <= 1) return []

  const result: CumulativeDataPoint[] = []

  for (let i = 1; i < cumulativeData.length; i++) {
    const currentBlock = cumulativeData[i]
    const previousBlock = cumulativeData[i - 1]

    const totalGasUsed = Number(currentBlock.cumulativeGasUsed) - Number(previousBlock.cumulativeGasUsed)
    const totalGasLimit = Number(currentBlock.cumulativeGasLimit) - Number(previousBlock.cumulativeGasLimit)
    const totalNumTransactions =
      Number(currentBlock.cumulativeNumTransactions) - Number(previousBlock.cumulativeNumTransactions)

    const blockRange = currentBlock.blockNumber - previousBlock.blockNumber
    if (blockRange === 0) continue

    result.push({
      gasUsed: totalGasUsed,
      gasLimit: totalGasLimit,
      numTransactions: totalNumTransactions,
      usagePercentage: totalGasLimit > 0 ? (totalGasUsed / totalGasLimit) * 100 : 0,
      timestamp: currentBlock.blockTimestamp,
      startTimestamp: previousBlock.blockTimestamp,
    })
  }

  return result
}
