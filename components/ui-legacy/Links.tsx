import { Link as ChakraLink, Flex } from '@chakra-ui/react'
import Link from 'next/link'
import type { AddressString, BlockId, TransactionId } from '@/lib/schemas'
import { truncateAddress } from '@/lib/utils/address'
import { CopyToClipBoard } from './CopyToClipBoard'

export const AddressLink = ({ address, truncate = false }: { address: AddressString; truncate?: boolean }) => {
  return (
    <CopyableLink to={`/address/${address}`} value={address}>
      {truncate ? truncateAddress(address) : address}
    </CopyableLink>
  )
}

export const BlockLink = ({ blockId, children }: { blockId: BlockId; children: React.ReactNode }) => {
  return (
    <CopyableLink to={`/block/${blockId}`} value={blockId}>
      {children}
    </CopyableLink>
  )
}

export const TransactionLink = ({
  transactionId,
  children,
}: {
  transactionId: TransactionId
  children: React.ReactNode
}) => {
  return (
    <CopyableLink to={`/transaction/${transactionId}`} value={transactionId}>
      {children}
    </CopyableLink>
  )
}

export const BlockTransactionsLink = ({ blockId, children }: { blockId: BlockId; children: React.ReactNode }) => {
  return <BaseLink to={`/block/${blockId}/transactions`}>{children}</BaseLink>
}

export const TransactionClausesLink = ({
  transactionId,
  children,
}: {
  transactionId: TransactionId
  children: React.ReactNode
}) => {
  return <BaseLink to={`/transaction/${transactionId}/clauses`}>{children}</BaseLink>
}

export const ClauseLink = ({
  transactionId,
  clauseIndex,
  children,
}: {
  transactionId: TransactionId
  clauseIndex: number
  children: React.ReactNode
}) => {
  return <BaseLink to={`/transaction/${transactionId}/clauses/${clauseIndex}`}>{children}</BaseLink>
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
    <ChakraLink asChild color={{ base: 'primary.500', _dark: 'primary.400' }}>
      <Link
        href={to}
        style={{
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
        }}>
        {children}
      </Link>
    </ChakraLink>
  )
}
