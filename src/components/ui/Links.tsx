import { Link as RouterLink } from "react-router-dom"
import { Link as ChakraLink, Flex } from "@chakra-ui/react"
import { CopyToClipBoard } from "./CopyToClipBoard"
import { truncateAddress } from "@/utils/address"

export const AddressLink = ({ address, truncate = false }: { address: string; truncate?: boolean }) => {
  return (
    <CopyableLink to={`/address/${address}`} value={address}>
      {truncate ? truncateAddress(address) : address}
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

export const ClauseLink = ({
  transactionId,
  clauseIndex,
  children,
}: {
  transactionId: string
  clauseIndex: number
  children: React.ReactNode
}) => {
  return <BaseLink to={`/transaction/${transactionId}/clause/${clauseIndex}`}>{children}</BaseLink>
}

export const CopyableLink = ({ children, to, value }: { children: React.ReactNode; to: string; value: string }) => {
  return (
    <Flex gap={2} alignItems="center">
      <BaseLink to={to}>{children}</BaseLink>
      <CopyToClipBoard value={value} />
    </Flex>
  )
}

export const BaseLink = ({ children, to }: { children: React.ReactNode; to: string }) => {
  return (
    <ChakraLink asChild color={{ base: "primary.500", _dark: "primary.400" }}>
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
