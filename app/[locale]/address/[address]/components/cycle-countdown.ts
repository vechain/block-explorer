import { BLOCK_TIME_SECONDS } from '@/lib/constants/network'
import type { ValidatorDetails } from '@/services/veworld-indexer/validator-details'

// Epoch milliseconds, projected from the anchored block at the chain's fixed cadence.
// `chainHead.timestamp` is already milliseconds — `timestampSchema` scales it on parse.
export const cycleEndsAtMs = (validator: ValidatorDetails): number | null => {
  const { chainHead, cyclePeriodLength, completedPeriods, startBlock } = validator
  if (!chainHead || cyclePeriodLength === 0) return null

  const currentPeriodEndBlock = startBlock + completedPeriods * cyclePeriodLength + cyclePeriodLength

  return chainHead.timestamp + (currentPeriodEndBlock - chainHead.number) * BLOCK_TIME_SECONDS * 1000
}

const SECOND_MS = 1_000
const MINUTE_MS = 60 * SECOND_MS

// The label counts seconds through the final minute, so it has to tick that fast to reach
// zero; a minute is plenty for the days and hours it reads the rest of the time.
export const countdownTickMs = (remainingMs: number | null) =>
  remainingMs !== null && remainingMs > 0 && remainingMs <= MINUTE_MS ? SECOND_MS : MINUTE_MS
