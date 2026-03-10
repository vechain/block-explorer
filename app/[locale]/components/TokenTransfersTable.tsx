'use client'

import type { TransferFromBlock } from '@/services/veworld-indexer/recent-activity'
import { TransfersTable } from '../../../components/TransfersTable'

/**
 * Table component for displaying fungible token transfers (VET and ERC20 tokens).
 * This is a wrapper around the unified TransfersTable component.
 */
export const TokenTransfersTable = ({ transfers }: { transfers: TransferFromBlock[] }) => {
  // Filter to only show fungible tokens (VET and FUNGIBLE_TOKEN)
  const fungibleTransfers = transfers.filter(
    transfer => transfer.eventType === 'VET' || transfer.eventType === 'FUNGIBLE_TOKEN',
  )

  return <TransfersTable transfers={fungibleTransfers} transferType="all" />
}
