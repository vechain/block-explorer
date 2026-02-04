'use client'

import { Accordion, Button, Flex, Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TokenBalanceRow as TokenBalanceRowType, TokenBreakdownItem } from '@/hooks/useAccountTokens'
import { useFormatAmount } from '@/hooks/useFormatting'
import { getTokenIconPath } from '@/lib/utils/tokens'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { StackedTokenIcons } from '@/components/ui/StackedTokenIcons'

interface TokenBalanceSectionProps {
  tokenBalanceRows: TokenBalanceRowType[]
  isPending: boolean
}

interface ExpandableTokenBalanceProps {
  formattedBalance: string
  breakdown: TokenBreakdownItem[]
  decimals: number
}

const ExpandableTokenBalance = ({ formattedBalance, breakdown, decimals }: ExpandableTokenBalanceProps) => {
  const formatAmount = useFormatAmount()
  const breakdownSymbols = breakdown.map(item => item.symbol)

  return (
    <Accordion.Root collapsible width="100%">
      <Accordion.Item value="breakdown" border="none">
        <Accordion.ItemTrigger p={0} cursor="pointer" justifyContent="flex-end" _hover={{ opacity: 0.8 }}>
          <HStack gap={2}>
            <Text textStyle="bodyM" color="text-primary">
              {formattedBalance}
            </Text>
            <StackedTokenIcons symbols={breakdownSymbols} size={16} />
            <Accordion.ItemIndicator _icon={{ width: '14px', height: '14px', color: 'text-secondary' }} />
          </HStack>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent rounded="none">
          <Accordion.ItemBody pt={2} pb={0} display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
            {breakdown.map(item => {
              const [formatted] = formatAmount({ amount: item.balance ?? BigInt(0), decimals })
              const itemIconPath = getTokenIconPath(item.symbol)
              return (
                <HStack key={item.symbol} gap={3}>
                  <HStack gap={1}>
                    <Text textStyle="bodyS">{formatted}</Text>
                    <Text textStyle="bodyS" color="text-secondary">
                      {item.symbol}
                    </Text>
                  </HStack>
                  {itemIconPath && <Image src={itemIconPath} alt={item.symbol} width={12} height={12} />}
                </HStack>
              )
            })}
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  )
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

      if (token.breakdown && token.breakdown.length > 0) {
        const combinedTitle = token.breakdown.map(item => item.symbol).join(' / ')
        return {
          title: combinedTitle,
          children: (
            <ExpandableTokenBalance
              formattedBalance={formatted}
              breakdown={token.breakdown}
              decimals={token.decimals}
            />
          ),
        }
      }

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
