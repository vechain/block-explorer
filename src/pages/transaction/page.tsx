import { Navigate, useParams } from "react-router-dom"
import { parseHex } from "@/utils/hex"
import { useTransaction, useTransactionReceipt } from "@/services/thor/transaction/hooks"
import { Hex } from "@vechain/sdk-core"
import { Flex, Stack } from "@chakra-ui/react"
import { Subtitle, Title } from "@/components/ui/Typography"
import { CopyToClipBoard } from "@/components/ui/CopyToClipBoard"
import { DynamicFeeTransaction } from "./components/DynamicFeeTransaction"
import { LegacyTransaction } from "./components/LegacyTransaction"

export const TransactionPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>()
  const id = parseHex(transactionId)

  return id ? (
    <TransactionDetails id={id} />
  ) : (
    <Navigate to="/404" replace state={{ message: "Invalid transaction id" }} />
  )
}

const TransactionDetails = ({ id }: { id: Hex }) => {
  const { data: transaction, isLoading } = useTransaction(id)
  const { data: receipt, isLoading: isReceiptLoading } = useTransactionReceipt(id)

  if (isLoading || isReceiptLoading) return <div>Loading...</div>
  if (!transaction)
    return <Navigate to="/404" replace state={{ message: "The transaction you are looking for does not exist" }} />

  if (!receipt) return <div>Transaction is pending</div>

  return (
    <Stack>
      <Title>Transaction details</Title>
      <Flex alignItems="center" gap={2}>
        <Subtitle>{transaction.id.toString()}</Subtitle>
        <CopyToClipBoard value={transaction.id.toString()} />
      </Flex>

      {transaction.type === 81 ? (
        <DynamicFeeTransaction tx={transaction} receipt={receipt} />
      ) : (
        <LegacyTransaction tx={transaction} receipt={receipt} />
      )}
    </Stack>
  )
}
