'use client'

import { Stack } from '@chakra-ui/react'
import type { Account } from '@/lib/schemas'
import { AccountNftsSection } from '../sections/AccountNftsSection'
import { AccountSummary } from './AccountSummary'
import { AccountTransactionsSection } from '../sections/AccountTransactionsSection'

export const AccountDetails = ({ account }: { account: Account }) => {
  return (
    <Stack flex={1} gap="8">
      <AccountSummary address={account.address} />
      <AccountTransactionsSection address={account.address} />
      <AccountNftsSection address={account.address} />
    </Stack>
  )
}
