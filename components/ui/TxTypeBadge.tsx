import type { BadgeProps } from '@chakra-ui/react'
import { Badge } from '@chakra-ui/react'
import { type TransactionType, transactionTypeSchema } from '@/lib/schemas/transactions'
import { InfoTip } from './InfoTip'
import { useTranslation } from 'react-i18next'

interface TxTypeBadgeProps extends Omit<BadgeProps, 'children'> {
  type: TransactionType
  tooltip?: string
}

export const TxTypeBadge = ({ type, tooltip, ...props }: TxTypeBadgeProps) => {
  const content = type === transactionTypeSchema.enum.LEGACY ? 'Legacy' : 'Dynamic Fee'

  return (
    <BaseTxBadge {...props}>
      {content}
      {tooltip && <InfoTip tooltip={tooltip} />}
    </BaseTxBadge>
  )
}

interface TxFeaturesBadgeProps extends Omit<BadgeProps, 'children'> {
  features: number | undefined
}

export const TxFeaturesBadge = ({ features, ...props }: TxFeaturesBadgeProps) => {
  const { t } = useTranslation()

  if (features === 1) {
    return <BaseTxBadge {...props}>{t('VIP-191 - Fee delegation')}</BaseTxBadge>
  }

  return null
}

const BaseTxBadge = (props: BadgeProps) => {
  return (
    <Badge
      textStyle="bodyM"
      bg="bg-alt-secondary"
      color="text-primary"
      gap="2"
      px="2"
      py="1"
      rounded="8px"
      {...props}
    />
  )
}
