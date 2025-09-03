'use client'

import { Flex, Heading, Icon, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FaListCheck } from 'react-icons/fa6'
import { LuArrowLeftRight, LuBox } from 'react-icons/lu'
import { useClausesPerSecond, useTransactionsPerSecond } from '@/hooks/stats-per-second'
import { useBestBlock } from '@/services/thor/hooks'

const NUMBER_OF_BLOCKS = 10

export const BlockNumberCard = () => {
  const { t } = useTranslation()
  const { data: bestBlock, isPending } = useBestBlock()

  const blockNumber = bestBlock?.number.toLocaleString() || '-'

  return <InsightDataCard label={t('block_number')} value={blockNumber} isPending={isPending} icon={<LuBox />} />
}

export const TransactionsPerSecondCard = () => {
  const { data: transactionsPerSecond, isPending } = useTransactionsPerSecond({ numBlocks: NUMBER_OF_BLOCKS })

  const value = `${Math.floor(transactionsPerSecond).toLocaleString()} tx/s`

  return <InsightDataCard label="TPS" value={value} isPending={isPending} icon={<LuArrowLeftRight />} />
}

export const ClausesPerSecondCard = () => {
  const { data: clausesPerSecond, isPending } = useClausesPerSecond({ numBlocks: 10 })

  const value = `${Math.floor(clausesPerSecond).toLocaleString()} clause/s`

  return <InsightDataCard label="CPS" value={value} isPending={isPending} icon={<FaListCheck />} />
}

type InsightDataCardProps = {
  label: string
  value: string
  isPending: boolean
  icon: React.ReactElement
}

const InsightDataCard = ({ icon, label, value, isPending }: InsightDataCardProps) => {
  const circle = { rounded: 'full', border: '1px solid', borderColor: 'border.emphasized', p: 1 }

  return (
    <Flex gap={6} borderRadius="xl" px={6} py={10} bg="bg.emphasized" flex={1}>
      <Stack flex={1}>
        <Heading as="h4" size="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase">
          {label}
        </Heading>
        {isPending ? (
          <Skeleton height="30px" width="80%" bg="fg.muted" />
        ) : (
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {value}
          </Text>
        )}
      </Stack>

      <Flex w="60px" h="60px" alignItems="center" justifyContent="center" {...circle}>
        <Flex w="100%" h="100%" alignItems="center" justifyContent="center" {...circle}>
          <Icon w="20px" h="20px" color="fg">
            {icon}
          </Icon>
        </Flex>
      </Flex>
    </Flex>
  )
}
