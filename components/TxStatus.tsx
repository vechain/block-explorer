'use client'

import { TransactionStatus } from '@/lib/types'
import { Badge, BadgeProps } from '@chakra-ui/react'
import Image from 'next/image'

interface TxStatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: TransactionStatus
}

const statusConfig: Record<
  TransactionStatus,
  {
    label: string
    bg: string
    color: string
    icon: React.ReactNode
  }
> = {
  success: {
    label: 'Success',
    bg: 'success-surface',
    color: 'success-text',
    icon: <Image src="/icons/success.svg" alt="Success" width={12} height={12} />,
  },
  pending: {
    label: 'Pending',
    bg: 'pending-surface',
    color: 'pending-text',
    icon: <Image src="/icons/pending.svg" alt="Pending" width={12} height={12} />,
  },
  reverted: {
    label: 'Reverted',
    bg: 'error-surface',
    color: 'error-text',
    icon: <Image src="/icons/revert.svg" alt="Reverted" width={12} height={12} />,
  },

  //* Statuses not used yet 👇

  // active: {
  //   label: 'Active',
  //   bg: 'success-surface',
  //   color: 'success-text',
  //   icon: <Image src="/icons/ellipse-full.svg" alt="Active" width={6} height={6} />,
  // },
  // offline: {
  //   label: 'Offline',
  //   bg: 'error-surface',
  //   color: 'error-text',
  //   icon: <Image src="/icons/ellipse-outline.svg" alt="Offline" width={6} height={6} />,
  // },
}

export const TxStatusBadge = ({ status, ...props }: TxStatusBadgeProps) => {
  const config = statusConfig[status]

  return (
    <Badge textStyle="bodyM" bg={config.bg} color={config.color} gap="1" py="1" px="2" rounded="full" {...props}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

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
