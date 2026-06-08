'use client'

import { TransactionStatus } from '@/lib/types'
import Image from 'next/image'

export const TxStatusIcon = ({ status }: { status: TransactionStatus }) => {
  let icon: string

  switch (status) {
    case TransactionStatus.SUCCESS:
      icon = 'success'
      break
    case TransactionStatus.REVERTED:
      icon = 'revert'
      break
    case TransactionStatus.PENDING:
      icon = 'pending'
      break
    default:
      return null
  }

  return <Image src={`/icons/${icon}.svg`} alt={status} width={16} height={16} />
}
