'use client'

import { Heading, Stack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowDownLeft, LuArrowUpRight, LuFlame } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { Balance, VETBalance, VTHOBalance } from '@/components/ui/Balance'
import type { AddressString } from '@/lib/schemas'
import { useAccountOverview } from '@/services/veworld-indexer/hooks'

export const AccountActivitySection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const { data: overview } = useAccountOverview(address)

  const items: DataCardGroupItem[] = [
    {
      icon: <LuArrowDownLeft />,
      title: t('Total VET Received'),
      children: <VETBalance balance={BigInt(overview?.vetReceived ?? '0')} />,
    },
    {
      icon: <LuArrowUpRight />,
      title: t('Total VET Sent'),
      children: <VETBalance balance={BigInt(overview?.vetSent ?? '0')} />,
    },
    {
      icon: <LuFlame />,
      title: t('Gas Used'),
      children: <Balance balance={BigInt(overview?.gasUsed ?? '0')} symbol="VTHO" decimals={5} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Burned'),
      children: <VTHOBalance balance={BigInt(overview?.vthoBurned ?? '0')} />,
    },
    {
      icon: <LuFlame />,
      title: t('VTHO Delegated'),
      children: <VTHOBalance balance={BigInt(overview?.vthoDelegated ?? '0')} />,
    },
  ]

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Activity')}
      </Heading>
      <Stack gap="4">
        <DataCardGroup items={items} desktopColumns={3} />
      </Stack>
    </Card>
  )
}
