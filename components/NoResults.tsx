'use client'

import { EmptyState, VStack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeftRight, LuBox, LuCoins, LuFileCode } from 'react-icons/lu'

interface EmptyStateContainerProps {
  title: string
  description: string
  icon: ReactNode
}

const EmptyStateContainer = ({ title, description, icon }: EmptyStateContainerProps) => {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>{icon}</EmptyState.Indicator>
        <VStack textAlign="center" gap={1}>
          <EmptyState.Title>{title}</EmptyState.Title>
          <EmptyState.Description>{description}</EmptyState.Description>
        </VStack>
      </EmptyState.Content>
    </EmptyState.Root>
  )
}

export const NoTransactions = ({ description }: { description?: string } = {}) => {
  const { t } = useTranslation()
  return (
    <EmptyStateContainer
      icon={<LuArrowLeftRight />}
      title={t('No transactions')}
      description={description ?? t('No transactions have been recorded yet')}
    />
  )
}

export const NoTokens = () => {
  const { t } = useTranslation()
  return <EmptyStateContainer icon={<LuCoins />} title={t('No tokens')} description={t('This account has no tokens')} />
}

export const NoTokenTransfers = () => {
  const { t } = useTranslation()
  return (
    <EmptyStateContainer
      icon={<LuCoins />}
      title={t('No token transfers')}
      description={t('No token transfers have been recorded yet')}
    />
  )
}

export const NoMints = () => {
  const { t } = useTranslation()
  return (
    <EmptyStateContainer icon={<LuCoins />} title={t('No tokens')} description={t('No tokens have been minted yet')} />
  )
}

export const NoBlocks = () => {
  const { t } = useTranslation()
  return (
    <EmptyStateContainer icon={<LuBox />} title={t('No blocks')} description={t('No blocks have been recorded yet')} />
  )
}

export const NoContracts = () => {
  const { t } = useTranslation()
  return (
    <EmptyStateContainer
      icon={<LuFileCode />}
      title={t('No contracts')}
      description={t('This account has not deployed any contracts yet')}
    />
  )
}
