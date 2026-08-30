import { BLOCK_TIME_MS } from '@/lib/constants/network'

/** Depth at which the badge stops counting and reads `>12`, so the head can change nothing after. */
export const CONFIRMATIONS_CAP = 12

// Five slots per capped confirmation, so missed slots cannot strand a tx below the cap.
const SETTLED_AFTER_MS = 5 * CONFIRMATIONS_CAP * BLOCK_TIME_MS

/** `blockTimestamp` is milliseconds, as `timestampSchema` leaves it. */
export const isConfirmationsSettled = (blockTimestamp: number, now = Date.now()) =>
  now - blockTimestamp > SETTLED_AFTER_MS

export const cappedConfirmations = (bestBlockNumber: number, transactionBlockNumber: number) =>
  Math.min(CONFIRMATIONS_CAP, Math.max(0, bestBlockNumber - transactionBlockNumber))
