'use client'

import { Button } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuRotateCcw } from 'react-icons/lu'

interface NowButtonProps {
  onClick: () => void
}

export const NowButton = ({ onClick }: NowButtonProps) => {
  const { t } = useTranslation()

  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      <LuRotateCcw />
      {t('Reset')}
    </Button>
  )
}
