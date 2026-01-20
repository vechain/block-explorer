'use client'

import { notFound } from 'next/navigation'
import type { AddressString } from '@/lib/schemas'
import { useAccount } from '@/services/thor/hooks'
import { Skeleton, Stack } from '@chakra-ui/react'
import { AccountSummary } from './AccountSummary'
import { AccountTransactionsSection } from './sections/AccountTransactionsSection'
import { AccountActivitySection } from './sections/AccountActivitySection'
import { AccountNftsSection } from './sections/AccountNftsSection'
import { DeployedContractsSection } from './sections/DeployedContractsSection'
import { ContractSummary } from './ContractSummary'

export const AddressPageContent = ({ address }: { address: AddressString }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)

  if (isAccountLoading) return <Skeleton height="400px" width="100%" />

  if (!account) {
    notFound()
  }

  return (
    <Stack flex={1} gap="8">
      {account.hasCode ? <ContractSummary address={account.address} /> : <AccountSummary address={account.address} />}
      <AccountActivitySection address={account.address} />
      <AccountTransactionsSection address={account.address} hasCode={account.hasCode} />
      {!account.hasCode && <AccountNftsSection address={account.address} />}
      {!account.hasCode && <DeployedContractsSection address={account.address} />}
    </Stack>
  )
}
