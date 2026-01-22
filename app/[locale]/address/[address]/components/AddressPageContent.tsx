'use client'

import { notFound } from 'next/navigation'
import type { AddressString } from '@/lib/schemas'
import { useAccount } from '@/services/thor/hooks'
import { useValidatorDetails } from '@/services/veworld-indexer/hooks'
import { Center, Spinner, Stack } from '@chakra-ui/react'
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
  const { data: account, isLoading: isAccountLoading, isFetched: isAccountFetched } = useAccount(address)
  const { data: validator, isPending: isValidatorPending, isValidator } = useValidatorDetails(address)

  const isLoading = isAccountLoading || isValidatorPending

  if (isLoading)
    return (
      <Center height="50vh">
        <Spinner color="primary" size="xl" />
      </Center>
    )
  if (isAccountFetched && !isAccountLoading && !account) {
    notFound()
  }

  // Determine address type based on available data
  const addressType: AddressType = isValidator && validator ? 'validator' : account?.hasCode ? 'contract' : 'account'

  // Use address from account if available, otherwise use prop
  const resolvedAddress = account?.address ?? address

  // Render validator page
  if (addressType === 'validator' && validator) {
    return (
      <Stack flex={1} gap="8">
        <ValidatorSummary address={resolvedAddress} validator={validator} />
      </Stack>
    )
  }

  // While still determining if it's a validator, show account/contract layout
  // This prevents flicker when validator data loads after account data
  if (isValidatorPending && !isValidator) {
    // Show account or contract layout based on what we know
    if (account?.hasCode) {
      return (
        <Stack flex={1} gap="8">
          <ContractSummary address={resolvedAddress} />
          <AccountActivitySection address={resolvedAddress} />
          <AccountTransactionsSection address={resolvedAddress} hasCode={true} />
        </Stack>
      )
    }

    return (
      <Stack flex={1} gap="8">
        <AccountSummary address={resolvedAddress} />
        <AccountActivitySection address={resolvedAddress} />
        <AccountTransactionsSection address={resolvedAddress} hasCode={false} />
        <AccountNftsSection address={resolvedAddress} />
        <DeployedContractsSection address={resolvedAddress} />
      </Stack>
    )
  }

  // Render contract page
  if (addressType === 'contract') {
    return (
      <Stack flex={1} gap="8">
        <ContractSummary address={resolvedAddress} />
        <AccountActivitySection address={resolvedAddress} />
        <AccountTransactionsSection address={resolvedAddress} hasCode={true} />
      </Stack>
    )
  }

  // Default: account (EOA)
  return (
    <Stack flex={1} gap="8">
      <AccountSummary address={resolvedAddress} />
      <AccountActivitySection address={resolvedAddress} />
      <AccountTransactionsSection address={resolvedAddress} hasCode={account?.hasCode ?? false} />
      <AccountNftsSection address={resolvedAddress} />
      <DeployedContractsSection address={resolvedAddress} />
    </Stack>
  )
}
