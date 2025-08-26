import { Navigate, useNavigate, useParams } from "react-router-dom"
import { parseHex } from "@/utils/hex"

import { useTransaction, useTransactionReceipt } from "@/services/thor/transaction/hooks"
import { Hex } from "@vechain/sdk-core"
import { TransactionDetail } from "@/services/thor/transaction/actions"
import { TransactionReceipt } from "@vechain/sdk-network"
import { Group, Stack, Tabs, Text } from "@chakra-ui/react"
import { ClauseDetailsTable } from "./components/ClauseDetailsTable"
import { Title } from "@/components/ui/Typography"
import { Subtitle } from "@/components/ui/Typography"
import { LuInfo } from "react-icons/lu"
import { AiOutlineWechat } from "react-icons/ai"
import { TbTransfer } from "react-icons/tb"
import { VscNewFile } from "react-icons/vsc"
import { Pagination } from "@/components/ui/Pagination"
import { VETTransferTable } from "@/components/VETTransferTable"
import { EventList } from "./components/EventList"
import { VnsBadgeOrAddressLink } from "@/components/ui/VnsBadge"
import { NoContractCreation, NoEvents, NoTransfers } from "@/components/NoResults"

export const ClauseDetailsPage = () => {
  const { transactionId, clauseIndex } = useParams<{ transactionId: string; clauseIndex: string }>()

  const id = parseHex(transactionId)
  const index = parseInt(clauseIndex ?? "0")

  return id ? (
    <ClauseTransactionLoader transactionId={id} clauseIndex={index} />
  ) : (
    <Navigate to="/404" replace state={{ message: "Invalid transaction id" }} />
  )
}

const ClauseTransactionLoader = ({ transactionId, clauseIndex }: { transactionId: Hex; clauseIndex: number }) => {
  const { data: transaction, isLoading } = useTransaction(transactionId)
  const { data: receipt, isLoading: isReceiptLoading } = useTransactionReceipt(transactionId)

  if (isLoading || isReceiptLoading) return <div>Loading...</div>
  if (!transaction || !receipt)
    return <Navigate to="/404" replace state={{ message: "The transaction you are looking for does not exist" }} />

  return <ClausePageContent tx={transaction} clauseIndex={clauseIndex} receipt={receipt} />
}

const ClausePageContent = ({
  tx,
  receipt,
  clauseIndex,
}: {
  tx: TransactionDetail
  receipt: TransactionReceipt
  clauseIndex: number
}) => {
  const navigate = useNavigate()

  const txId = tx.id.toString()
  const clause = tx.clauses[clauseIndex]
  const output = receipt.outputs[clauseIndex] ?? { events: [], transfers: [], contractAddress: null }

  const hasEvents = output.events.length > 0
  const hasTransfers = output.transfers.length > 0
  const hasContractCreation = !!output.contractAddress

  return (
    <Stack gap="4">
      <Group alignItems="baseline" gap="4">
        <Title>Clause details</Title>
        <Subtitle>
          {(clauseIndex + 1).toLocaleString()} of {tx.clauses.length}
        </Subtitle>
      </Group>

      <Tabs.Root defaultValue="details" variant="subtle">
        <Tabs.List bg="bg.muted" rounded="l3">
          <Tabs.Trigger value="details">
            <LuInfo />
            Details
          </Tabs.Trigger>
          <Tabs.Trigger value="events" disabled={!hasEvents}>
            <AiOutlineWechat />
            Events
          </Tabs.Trigger>
          <Tabs.Trigger value="transfers" disabled={!hasTransfers}>
            <TbTransfer />
            VET Transfers
          </Tabs.Trigger>
          <Tabs.Trigger value="contract-creation" disabled={!hasContractCreation}>
            <VscNewFile />
            Contract created
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>

        <Tabs.Content value="details">
          <ClauseDetailsTable clause={clause} txId={txId} clauseIndex={clauseIndex} />
        </Tabs.Content>
        <Tabs.Content value="events">{hasEvents ? <EventList eventLogs={output.events} /> : <NoEvents />}</Tabs.Content>
        <Tabs.Content value="transfers">
          {hasTransfers ? <VETTransferTable transfers={output.transfers} /> : <NoTransfers />}
        </Tabs.Content>
        <Tabs.Content value="contract-creation">
          {hasContractCreation ? <CreatedContract address={output.contractAddress!} /> : <NoContractCreation />}
        </Tabs.Content>
      </Tabs.Root>

      {tx.clauses.length > 1 && (
        <Pagination
          page={clauseIndex}
          hasNext={clauseIndex < tx.clauses.length - 1}
          onPageChange={page => {
            navigate(`/transaction/${txId}/clause/${page - 1}`)
          }}
        />
      )}
    </Stack>
  )
}

const CreatedContract = ({ address }: { address: string }) => {
  return (
    <Group gap={2}>
      <Text fontWeight="bold">Created contract address</Text>
      <VnsBadgeOrAddressLink address={address.toString()} />
    </Group>
  )
}
