import type { BlockUsageData } from '@/lib/schemas'

export type BlockUsageDataPoint = {
  id: string
  gasLimit: number
  gasUsed: number
  number: number
  timestamp: number
}

/**
 * Transforms cumulative block usage data to per-block values for chart display
 *
 * The indexer returns cumulative values, so we need to calculate the difference
 * between consecutive blocks to get the actual values for each block.
 *
 * For sparse data (non-consecutive blocks), we calculate the average per block
 * over the range between data points.
 *
 * The first record is used only as a baseline and is discarded since it cannot
 * be calculated (no previous record to subtract from).
 */
export const transformBlockUsageData = (cumulativeData: BlockUsageData[]): BlockUsageDataPoint[] => {
  if (cumulativeData.length <= 1) return []

  const result: BlockUsageDataPoint[] = []

  for (let i = 1; i < cumulativeData.length; i++) {
    const currentBlock = cumulativeData[i]
    const previousBlock = cumulativeData[i - 1]

    // Convert string values to numbers
    const currentGasUsed = Number(currentBlock.cumulativeGasUsed)
    const currentGasLimit = Number(currentBlock.cumulativeGasLimit)
    const previousGasUsed = Number(previousBlock.cumulativeGasUsed)
    const previousGasLimit = Number(previousBlock.cumulativeGasLimit)

    // Calculate total difference between blocks
    const totalGasUsed = currentGasUsed - previousGasUsed
    const totalGasLimit = currentGasLimit - previousGasLimit

    // Calculate number of blocks in this range
    const blockRange = currentBlock.blockNumber - previousBlock.blockNumber

    // Prevent division by zero in case of duplicate or malformed data
    if (blockRange === 0) {
      // Optionally, you could log a warning here
      continue
    }
    // Calculate average per block (for sparse data) or actual values (for consecutive blocks)
    const gasUsed = blockRange > 1 ? totalGasUsed / blockRange : totalGasUsed
    const gasLimit = blockRange > 1 ? totalGasLimit / blockRange : totalGasLimit

    result.push({
      id: currentBlock.blockId,
      gasLimit,
      gasUsed,
      number: currentBlock.blockNumber,
      timestamp: currentBlock.blockTimestamp,
    })
  }

  return result
}
