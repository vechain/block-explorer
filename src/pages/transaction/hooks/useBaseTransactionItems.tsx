import { hexStringSchema } from "@/schemas"

import { BlockLink, TransactionClausesLink, TransactionLink } from "@/components/ui/Links"
import { formatDateFromTimestamp } from "@/utils/date"
import { CopyableText } from "@/components/ui/CopyToClipBoard"
import { VnsBadgeOrAddressLink } from "@/components/ui/VnsBadge"

import { PaidGasFees } from "@/components/PaidGasFees"
import { TxStatus } from "@/components/TxStatus"
import { Size } from "@/components/Size"
import { VTHOBalance } from "@/components/ui/TokenBalance"
import { hexToBigInt } from "viem"
import { GasUsed } from "@/components/GasUsed"
import { TransactionReceipt } from "@vechain/sdk-network"
import { BaseTransaction } from "@/services/thor/transaction/actions"

export function useBaseTransactionItems(tx: BaseTransaction, receipt: TransactionReceipt | undefined) {
  const status = receipt ? (receipt.reverted ? "reverted" : "success") : "pending"

  return {
    id: {
      name: "ID",
      value: <CopyableText value={tx.id.toString()} />,
    },
    status: {
      name: "Status",
      value: <TxStatus status={status} />,
    },
    blockNumber: {
      name: "Block Number",
      value: <BlockLink blockId={tx.meta.blockID}>#{tx.meta.blockNumber.toLocaleString()}</BlockLink>,
    },
    blockId: {
      name: "Block ID",
      value: <BlockLink blockId={tx.meta.blockID}>{tx.meta.blockID}</BlockLink>,
    },
    timestamp: {
      name: "Timestamp",
      value: formatDateFromTimestamp(tx.meta.blockTimestamp),
    },
    size: {
      name: "Size",
      value: <Size size={tx.size} />,
    },
    origin: {
      name: "Origin",
      value: <VnsBadgeOrAddressLink address={tx.origin} />,
    },
    clauses: {
      name: "Clauses",
      value: <TransactionClausesLink transactionId={tx.id}>{tx.clauses.length} Clauses</TransactionClausesLink>,
    },
    chainTag: {
      name: "Chain Tag",
      value: tx.chainTag.toLocaleString(),
    },
    blockRef: {
      name: "Block Ref",
      value: tx.blockRef,
    },
    expiration: {
      name: "Expiration",
      value: tx.expiration.toLocaleString() + " Blocks",
    },
    nonce: {
      name: "Nonce",
      value: tx.nonce,
    },
    dependsOn: {
      name: "Depends On",
      value: tx.dependsOn ? <TransactionLink transactionId={tx.dependsOn}>{tx.dependsOn}</TransactionLink> : "-",
    },
    reward: {
      name: "Reward",
      value: receipt ? <VTHOBalance balance={hexToBigInt(hexStringSchema.parse(receipt.reward))} /> : "-",
    },
    gasUsed: {
      name: "Gas Used",
      value: receipt ? <GasUsed gasUsed={receipt.gasUsed} gasLimit={Number(tx.gas)} /> : "-",
    },
    gasFees: {
      name: "Gas fees",
      value: receipt ? <PaidGasFees paid={receipt.paid} delegator={receipt.gasPayer} /> : "-",
    },
  }
}
