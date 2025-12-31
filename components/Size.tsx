import { Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useFormatNumber } from '@/hooks/useFormatting'

export const Size = ({ size }: { size: number }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  return (
    <Text>
      {formatNumber(size)} {t('Bytes')}
    </Text>
  )
}
