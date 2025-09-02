'use client'

import type { Address } from '@vechain/sdk-core'
import { notFound } from 'next/navigation'
import { use } from 'react'
import { parseAddress } from '@/lib/utils/address'
import { useAccount } from '@/services/thor/hooks'
import { AccountDetails } from './components/AccountDetails'
import { ContractDetails } from './components/ContractDetails'

export default function AddressPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params)
  const addr = parseAddress(address)

  if (!addr) {
    notFound()
  }

  return <RenderAccountOrContract address={addr} />
}

const RenderAccountOrContract = ({ address }: { address: Address }) => {
  const { data: account, isLoading: isAccountLoading } = useAccount(address)

  if (isAccountLoading) return <div>Loading...</div>

  if (!account) {
    notFound()
  }

  return account.hasCode ? <ContractDetails account={account} /> : <AccountDetails account={account} />
}
