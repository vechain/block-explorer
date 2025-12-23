import type { BadgeProps } from '@chakra-ui/react'
import { Badge } from '@chakra-ui/react'
import Image from 'next/image'
import { LuCheck } from 'react-icons/lu'

type Status = 'success' | 'pending' | 'reverted' | 'active' | 'offline'

interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: Status
}

const statusConfig: Record<
  Status,
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
    icon: <LuCheck size="12px" />,
  },
  pending: {
    label: 'Pending',
    bg: 'pending-surface',
    color: 'pending-text',
    icon: <LuCheck size="12px" />,
  },
  reverted: {
    label: 'Reverted',
    bg: 'error-surface',
    color: 'error-text',
    icon: <Image src="/icons/revert.svg" alt="Reverted" width={12} height={12} />,
  },
  active: {
    label: 'Active',
    bg: 'success-surface',
    color: 'success-text',
    icon: <Image src="/icons/ellipse-full.svg" alt="Active" width={6} height={6} />,
  },
  offline: {
    label: 'Offline',
    bg: 'error-surface',
    color: 'error-text',
    icon: <Image src="/icons/ellipse-outline.svg" alt="Offline" width={6} height={6} />,
  },
}

export const StatusBadge = ({ status, ...props }: StatusBadgeProps) => {
  const config = statusConfig[status]

  return (
    <Badge textStyle="bodyM" bg={config.bg} color={config.color} gap="1" py="1" px="2" rounded="full" {...props}>
      {config.icon}
      {config.label}
    </Badge>
  )
}
