import type { TransactionReceipt } from '@vechain/sdk-network'
import { GasUsed } from '@/components/GasUsed'
import { PaidGasFees } from '@/components/PaidGasFees'
import { Size } from '@/components/Size'
import { TxStatus } from '@/components/TxStatus'
import { CopyableText } from '@/components/ui/CopyToClipBoard'
import { BlockLink, TransactionClausesLink, TransactionLink } from '@/components/ui/Links'
import { VTHOBalance } from '@/components/ui/TokenBalance'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import { addressStringSchema, hexStringSchema } from '@/lib/schemas'
import { formatDateFromTimestamp } from '@/lib/utils/date'
import type { BaseTransaction } from '@/services/thor/transaction'

export const useBaseTransactionItems = (tx: BaseTransaction, receipt: TransactionReceipt | undefined) => {
  const status = receipt ? (receipt.reverted ? 'reverted' : 'success') : 'pending'

  return {
    id: {
      name: 'ID',
      value: <CopyableText value={tx.id.toString()} />,
    },
    status: {
      name: 'Status',
      value: <TxStatus status={status} />,
    },
    blockNumber: {
      name: 'Block Number',
      value: <BlockLink blockId={tx.meta.blockID}>#{tx.meta.blockNumber.toLocaleString()}</BlockLink>,
    },
    blockId: {
      name: 'Block ID',
      value: <BlockLink blockId={tx.meta.blockID}>{tx.meta.blockID}</BlockLink>,
    },
    timestamp: {
      name: 'Timestamp',
      value: formatDateFromTimestamp(tx.meta.blockTimestamp),
    },
    size: {
      name: 'Size',
      value: <Size size={tx.size} />,
    },
    origin: {
      name: 'Origin',
      value: <VnsBadgeOrAddressLink address={addressStringSchema.parse(tx.origin)} />,
    },
    clauses: {
      name: 'Clauses',
      value: <TransactionClausesLink transactionId={tx.id}>{tx.clauses.length} Clauses</TransactionClausesLink>,
    },
    chainTag: {
      name: 'Chain Tag',
      value: tx.chainTag.toLocaleString(),
    },
    blockRef: {
      name: 'Block Ref',
      value: tx.blockRef,
    },
    expiration: {
      name: 'Expiration',
      value: `${tx.expiration.toLocaleString()} Blocks`,
    },
    nonce: {
      name: 'Nonce',
      value: tx.nonce,
    },
    dependsOn: {
      name: 'Depends On',
      value: tx.dependsOn ? <TransactionLink transactionId={tx.dependsOn}>{tx.dependsOn}</TransactionLink> : '-',
    },
    reward: {
      name: 'Reward',
      value: receipt ? <VTHOBalance balance={hexStringSchema.parse(receipt.reward)} /> : '-',
    },
    gasUsed: {
      name: 'Gas Used',
      value: receipt ? <GasUsed gasUsed={receipt.gasUsed} gasLimit={Number(tx.gas)} /> : '-',
    },
    gasFees: {
      name: 'Gas fees',
      value: receipt ? (
        <PaidGasFees paid={receipt.paid} delegator={addressStringSchema.parse(receipt.gasPayer)} />
      ) : (
        '-'
      ),
    },
  }
}
