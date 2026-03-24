'use client'

import type { AddressString } from '@/lib/schemas'
import { useRedirectOnNotFound } from '@/hooks/useRedirectOnNotFound'
import { useAccount } from '@/services/thor/account'
import { useValidatorDetails } from '@/services/veworld-indexer/validator-details'
import { Center, Spinner, Stack } from '@chakra-ui/react'
import { AccountSummary } from './AccountSummary'
import { AccountTransactionsSection } from './sections/AccountTransactionsSection'
import { AccountActivitySection } from './sections/AccountActivitySection'
import { EndorsedValidatorsSection } from './sections/EndorsedValidatorsSection'
import { AccountNftsSection } from './sections/AccountNftsSection'
import { DeployedContractsSection } from './sections/DeployedContractsSection'
import { AccountTokenTransfersSection } from './sections/AccountTokenTransfersSection'
import { ContractSummary } from './ContractSummary'
import { ValidatorSummary } from './ValidatorSummary'

// Address types for conditional rendering
type AddressType = 'validator' | 'contract' | 'account'

export const AddressPageContent = ({ address }: { address: AddressString }) => {
  const { data: account, isLoading: isAccountLoading, isFetched: isAccountFetched } = useAccount(address)
  const { data: validator, isFetched: isValidatorFetched, isValidator } = useValidatorDetails(address)

  const isLoading = isAccountLoading || !isValidatorFetched

  const isNotFound = useRedirectOnNotFound({ isNotFound: !isLoading && isAccountFetched && !account })

  if (isLoading || isNotFound)
    return (
      <Center height="50vh">
        <Spinner color="primary" size="xl" />
      </Center>
    )

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

  // Render contract page
  if (addressType === 'contract') {
    return (
      <Stack flex={1} gap="8">
        <ContractSummary address={resolvedAddress} />
        <AccountActivitySection address={resolvedAddress} />
        <AccountTransactionsSection address={resolvedAddress} hasCode={true} />
        <AccountTokenTransfersSection address={resolvedAddress} />
      </Stack>
    )
  }

  // Default: account (EOA)
  return (
    <Stack flex={1} gap="8">
      <AccountSummary address={resolvedAddress} />
      <EndorsedValidatorsSection address={resolvedAddress} />
      <AccountActivitySection address={resolvedAddress} showSummaryCards />
      <AccountTransactionsSection address={resolvedAddress} hasCode={account?.hasCode ?? false} />
      <AccountTokenTransfersSection address={resolvedAddress} />
      <AccountNftsSection address={resolvedAddress} />
      <DeployedContractsSection address={resolvedAddress} />
    </Stack>
  )
}
