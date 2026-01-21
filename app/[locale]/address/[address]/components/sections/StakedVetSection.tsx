'use client'

import { Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useFormatAmount } from '@/hooks/useFormatting'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'

interface StakedVetSectionProps {
  stakedVet: bigint | undefined
  isPending: boolean
}

export const StakedVetSection = ({ stakedVet, isPending }: StakedVetSectionProps) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()

  // Don't render the section if there's no staked VET
  if (!isPending && (!stakedVet || stakedVet === 0n)) {
    return null
  }

  const [formatted] = formatAmount({ amount: stakedVet ?? 0n, decimals: 18 })

  const items: DataCardGroupItem[] = [
    {
      title: 'VET',
      children: (
        <HStack gap={2}>
          <Text textStyle="bodyM" color="text-primary">
            {formatted}
          </Text>
          <Image src="/tokens/vet.svg" alt="VET" width={16} height={16} />
        </HStack>
      ),
    },
  ]

  return (
    <Stack gap={4}>
      <Heading as="h3" textStyle="bodyL" color="text-primary">
        {t('VET Staked')}
      </Heading>
      {isPending ? (
        <Skeleton height="60px" borderRadius="md" />
      ) : (
        <DataCardGroup singleCard variant="outline" items={items} />
      )}
    </Stack>
  )
}
