import { Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

export const Size = ({ size }: { size: number }) => {
  const { t } = useTranslation()
  return (
    <Text>
      {size.toLocaleString()} {t('Bytes')}
    </Text>
  )
}
