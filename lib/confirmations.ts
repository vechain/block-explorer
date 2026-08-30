import { BLOCK_TIME_MS, NetworkName } from '@/lib/constants/network'

/** Depth at which the badge stops counting and reads `>12`, so the head can change nothing after. */
export const CONFIRMATIONS_CAP = 12

// Five slots per capped confirmation, so missed slots cannot strand a tx below the cap.
const SETTLED_AFTER_MS = 5 * CONFIRMATIONS_CAP * BLOCK_TIME_MS

/** `blockTimestamp` is milliseconds, as `timestampSchema` leaves it. */
export const isConfirmationsSettled = (blockTimestamp: number, networkName: NetworkName, now = Date.now()) =>
  // Solo mints on demand and can idle for hours, so age says nothing about depth there.
  networkName !== NetworkName.SOLO && now - blockTimestamp > SETTLED_AFTER_MS

const cappedConfirmations = (bestBlockNumber: number, transactionBlockNumber: number) =>
  Math.min(CONFIRMATIONS_CAP, Math.max(0, bestBlockNumber - transactionBlockNumber))

/** `undefined` while the head is still unknown and the depth is not yet settled. */
export const confirmationsToShow = ({
  settled,
  bestBlockNumber,
  transactionBlockNumber,
}: {
  settled: boolean
  bestBlockNumber: number | undefined
  transactionBlockNumber: number
}) => {
  if (settled) return CONFIRMATIONS_CAP
  if (bestBlockNumber === undefined) return undefined

  return cappedConfirmations(bestBlockNumber, transactionBlockNumber)
}
