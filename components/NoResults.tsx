'use client'

import { EmptyState } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { AiOutlineStop } from 'react-icons/ai'

export const NoTransfers = () => {
  const { t } = useTranslation()
  return <NoResults title={t('No transfers')} description={t('This account has not made any transfers yet')} />
}

export const NoTransactions = () => {
  const { t } = useTranslation()
  return <NoResults title={t('No transactions')} description={t('This account has not made any transactions yet')} />
}

export const NoTokens = () => {
  const { t } = useTranslation()
  return <NoResults title={t('No tokens')} description={t('This account has no tokens')} />
}

export const NoEvents = () => {
  const { t } = useTranslation()
  return <NoResults title={t('No events')} description={t('This transaction has no events')} />
}

export const NoContractCreation = () => {
  const { t } = useTranslation()
  return <NoResults title={t('No contract creation')} description={t('This clause has no contract creation')} />
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
