'use client'

import { notFound } from 'next/navigation'
import type { AddressString } from '@/lib/schemas'
import { useAccount } from '@/services/thor/hooks'
import { AccountDetails } from './details/AccountDetails'
import { ContractDetails } from './details/ContractDetails'

export const AddressPageContent = ({ address }: { address: AddressString }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)

  if (isAccountLoading) return <div>Loading...</div>

  if (!account) {
    notFound()
  }

  return account.hasCode ? <ContractDetails account={account} /> : <AccountDetails account={account} />
}
