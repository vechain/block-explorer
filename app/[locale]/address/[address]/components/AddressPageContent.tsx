'use client'

import { notFound } from 'next/navigation'
import type { AddressString } from '@/lib/schemas'
import { useAccount } from '@/services/thor/hooks'
import { useValidatorDetails } from '@/services/veworld-indexer/hooks'
import { Skeleton, Stack } from '@chakra-ui/react'
import { AccountSummary } from './AccountSummary'
import { AccountTransactionsSection } from './sections/AccountTransactionsSection'
import { AccountActivitySection } from './sections/AccountActivitySection'
import { AccountNftsSection } from './sections/AccountNftsSection'
import { DeployedContractsSection } from './sections/DeployedContractsSection'
import { ContractSummary } from './ContractSummary'
import { ValidatorSummary } from './ValidatorSummary'

// Address types for conditional rendering
type AddressType = 'validator' | 'contract' | 'account'

export const AddressPageContent = ({ address }: { address: AddressString }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)
  const { data: validator, isPending: isValidatorPending, isValidator } = useValidatorDetails(address)

  const isLoading = isAccountLoading || isValidatorPending

  if (isLoading) return <Skeleton height="400px" width="100%" />

  if (!account) {
    notFound()
  }

  // Determine address type: validator takes priority, then contract, then account
  const addressType: AddressType = isValidator && validator ? 'validator' : account.hasCode ? 'contract' : 'account'

  // Render based on address type
  if (addressType === 'validator' && validator) {
    return (
      <Stack flex={1} gap="8">
        <ValidatorSummary address={account.address} validator={validator} />
      </Stack>
    )
  }

  if (addressType === 'contract') {
    return (
      <Stack flex={1} gap="8">
        <ContractSummary address={account.address} />
        <AccountActivitySection address={account.address} />
        <AccountTransactionsSection address={account.address} hasCode={account.hasCode} />
      </Stack>
    )
  }

  // Default: account (EOA)
  return (
    <Stack flex={1} gap="8">
      <AccountSummary address={account.address} />
      <AccountActivitySection address={account.address} />
      <AccountTransactionsSection address={account.address} hasCode={account.hasCode} />
      <AccountNftsSection address={account.address} />
      <DeployedContractsSection address={account.address} />
    </Stack>
  )
}
