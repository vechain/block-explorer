'use client'

import { EmptyState } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { AiOutlineStop } from 'react-icons/ai'

export const NoTransactions = () => {
  const { t } = useTranslation()
  return <NoResults title={t('No transactions')} description={t('This account has not made any transactions yet')} />
}

export const NoTokens = () => {
  const { t } = useTranslation()
  return <NoResults title={t('No tokens')} description={t('This account has no tokens')} />
}

const NoResults = ({ title, description }: { title: string; description: string }) => {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <AiOutlineStop />
        </EmptyState.Indicator>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Content>
    </EmptyState.Root>
  )
}
