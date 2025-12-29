'use client'

import { Badge, type ColorPalette } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

type TxStatus = 'success' | 'reverted' | 'pending'

export const TxStatus = ({ status }: { status: TxStatus }) => {
  const { t } = useTranslation()
  let statusText: string
  let colorPalette: ColorPalette

  switch (status) {
    case 'success':
      statusText = t('success')
      colorPalette = 'green'
      break
    case 'reverted':
      statusText = t('Reverted')
      colorPalette = 'red'
      break
    case 'pending':
      statusText = t('Pending')
      colorPalette = 'yellow'
      break
    default:
      statusText = t('Unknown')
      colorPalette = 'gray'
      break
  }

  return (
    <Badge variant="surface" size="sm" colorPalette={colorPalette}>
      {statusText}
    </Badge>
  )
}
