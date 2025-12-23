import type { BadgeProps } from '@chakra-ui/react'
import { Badge } from '@chakra-ui/react'
import { type TransactionType, transactionTypeSchema } from '@/lib/schemas/transactions'
import { InfoTip } from './InfoTip'

interface TxTypeBadgeProps extends Omit<BadgeProps, 'children'> {
  type: TransactionType
  tooltip?: string
}

export const TxTypeBadge = ({ type, tooltip, ...props }: TxTypeBadgeProps) => {
  const content = type === transactionTypeSchema.enum.LEGACY ? 'Legacy' : 'Dynamic Fee'

  return (
    <Badge textStyle="bodyM" bg="bg-card-surface-2" color="text-primary" gap="2" px="2" py="1" rounded="8px" {...props}>
      {content}
      {tooltip && <InfoTip tooltip={tooltip} />}
    </Badge>
  )
}
