'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'
import type { AddressString } from '@/lib/schemas'
import { useAccount } from '@/services/thor/hooks'
import { AccountDetails } from './components/AccountDetails'
import { ContractDetails } from './components/ContractDetails'

export default function AddressPage({ params }: { params: Promise<{ address: AddressString }> }) {
  const { address } = use(params)

  if (!address) {
    notFound()
  }

  return <RenderAccountOrContract address={address} />
}

const RenderAccountOrContract = ({ address }: { address: AddressString }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)

  if (isAccountLoading) return <div>Loading...</div>

  if (!account) {
    notFound()
  }

  return account.hasCode ? <ContractDetails account={account} /> : <AccountDetails account={account} />
}
