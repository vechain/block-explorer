'use client'

import { Heading, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useValidatorsList } from '@/services/veworld-indexer/hooks'
import { ValidatorsTable } from './ValidatorsTable'

export const ValidatorsPageContent = () => {
  const { t } = useTranslation()
  const { data: validators, isPending } = useValidatorsList()

  return (
    <VStack gap={6} alignItems="stretch">
      <Heading as="h1" textStyle="displayS">
        {t('Validators')}
      </Heading>
      <ValidatorsTable validators={validators} isPending={isPending} />
    </VStack>
  )
}
