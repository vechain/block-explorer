'use client'

import { Button, Flex, Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TokenBalanceRow as TokenBalanceRowType } from '@/hooks/useAccountTokens'
import { useFormatAmount } from '@/hooks/useFormatting'
import { getTokenIconPath } from '@/lib/utils/tokens'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'

interface TokenBalanceSectionProps {
  tokenBalanceRows: TokenBalanceRowType[]
  isPending: boolean
}

const TOKEN_LIMIT = 5

export const TokenBalanceSection = ({ tokenBalanceRows, isPending }: TokenBalanceSectionProps) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()
  const [isExpanded, setIsExpanded] = useState(false)

  const { displayRows, hasMoreTokens } = useMemo(() => {
    const hasMore = tokenBalanceRows.length > TOKEN_LIMIT
    const rows = isExpanded ? tokenBalanceRows : tokenBalanceRows.slice(0, TOKEN_LIMIT)
    return { displayRows: rows, hasMoreTokens: hasMore }
  }, [tokenBalanceRows, isExpanded])

  const items: DataCardGroupItem[] = useMemo(() => {
    return displayRows.map(token => {
      const [formatted] = formatAmount({ amount: token.balance ?? BigInt(0), decimals: token.decimals })
      const iconPath = getTokenIconPath(token.symbol)
      return {
        title: token.symbol,
        children: (
          <HStack gap={2}>
            <Text textStyle="bodyM" color="text-primary">
              {formatted}
            </Text>
            {iconPath && <Image src={iconPath} alt={token.symbol} width={16} height={16} />}
          </HStack>
        ),
      }
    })
  }, [displayRows, formatAmount])

  return (
    <Stack gap={4}>
      <Heading as="h3" textStyle="bodyL" color="text-primary">
        {t('Token Balance')}
      </Heading>
      {isPending ? (
        <Skeleton height="120px" borderRadius="md" />
      ) : tokenBalanceRows.length === 0 ? (
        <DataCardGroup singleCard variant="outline" items={[{ title: t('No tokens'), children: null }]} />
      ) : (
        <DataCardGroup singleCard variant="outline" items={items} />
      )}
      {!isPending && hasMoreTokens && (
        <Flex justifyContent="center" alignItems="center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            color="text-primary"
            borderColor="border-primary"
            _hover={{ bg: 'bg-secondary' }}
          >
            {isExpanded ? t('Show Less') : t('Show All')} ({tokenBalanceRows.length})
          </Button>
        </Flex>
      )}
    </Stack>
  )
}
