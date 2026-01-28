'use client'

import type { TransferFromBlock } from '@/services/veworld-indexer/hooks'
import { TransfersTable } from '../../../components/TransfersTable'

/**
 * Table component for displaying NFT transfers.
 * This is a wrapper around the unified TransfersTable component filtered for NFTs.
 */
export const NFTTransfersTable = ({ transfers }: { transfers: TransferFromBlock[] }) => {
  return <TransfersTable transfers={transfers} transferType="NFT" />
}
