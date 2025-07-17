import { Link as RouterLink } from "react-router-dom"
import { Link as ChakraLink, Flex } from "@chakra-ui/react"
import { CopyToClipBoard } from "./CopyToClipBoard"

export const AddressLink = ({ address }: { address: string }) => {
  return (
    <CopyableLink to={`/address/${address}`} value={address}>
      {address}
    </CopyableLink>
  )
}

export const BlockLink = ({ blockId, children }: { blockId: string; children: React.ReactNode }) => {
  return (
    <CopyableLink to={`/block/${blockId}`} value={blockId}>
      {children}
    </CopyableLink>
  )
}

export const TransactionLink = ({ transactionId, children }: { transactionId: string; children: React.ReactNode }) => {
  return (
    <CopyableLink to={`/transaction/${transactionId}`} value={transactionId}>
      {children}
    </CopyableLink>
  )
}

export const BlockTransactionsLink = ({ blockId, children }: { blockId: string; children: React.ReactNode }) => {
  return <BaseLink to={`/block/${blockId}/transactions`}>{children}</BaseLink>
}

export const TransactionClausesLink = ({
  transactionId,
  children,
}: {
  transactionId: string
  children: React.ReactNode
}) => {
  return <BaseLink to={`/transaction/${transactionId}/clauses`}>{children}</BaseLink>
}

const CopyableLink = ({ children, to, value }: { children: React.ReactNode; to: string; value: string }) => {
  return (
    <Flex gap={2} alignItems="center">
      <BaseLink to={to}>{children}</BaseLink>
      <CopyToClipBoard value={value} />
    </Flex>
  )
}

const BaseLink = ({ children, to }: { children: React.ReactNode; to: string }) => {
  return (
    <ChakraLink asChild colorPalette="blue">
      <RouterLink
        to={to}
        style={{
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block",
        }}>
        {children}
      </RouterLink>
    </ChakraLink>
  )
}
