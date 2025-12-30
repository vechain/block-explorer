'use client'

import { Button, Flex, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenBalanceRow } from './TokenBalanceRow'
import type { TokenBalanceRow as TokenBalanceRowType } from '@/hooks/useAccountTokens'

interface TokenBalanceSectionProps {
  tokenBalanceRows: TokenBalanceRowType[]
  isPending: boolean
}

const TOKEN_LIMIT = 5

export const TokenBalanceSection = ({ tokenBalanceRows, isPending }: TokenBalanceSectionProps) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const { displayRows, hasMoreTokens } = useMemo(() => {
    const hasMore = tokenBalanceRows.length > TOKEN_LIMIT
    const rows = isExpanded ? tokenBalanceRows : tokenBalanceRows.slice(0, TOKEN_LIMIT)
    return { displayRows: rows, hasMoreTokens: hasMore }
  }, [tokenBalanceRows, isExpanded])

  return (
    <Stack gap={0}>
      <Heading as="h3" textStyle="bodyL" mb={4} color="text-primary">
        {t('Token Balance')}
      </Heading>
      <Stack gap={0}>
        {isPending ? (
          <>
            <Skeleton height="60px" borderRadius="md" />
            <Skeleton height="60px" borderRadius="md" mt={2} />
          </>
        ) : tokenBalanceRows.length === 0 ? (
          <Flex px={6} py={4} borderWidth="1px" borderColor="border-primary" borderRadius="md">
            <Text textStyle="bodyM" color="text-primary">
              {t('No tokens')}
            </Text>
          </Flex>
        ) : (
          displayRows.map((token, index) => (
            <TokenBalanceRow
              key={token.key}
              token={token}
              balance={token.balance}
              isFirst={index === 0}
              isLast={index === displayRows.length - 1}
            />
          ))
        )}
      </Stack>
      {!isPending && hasMoreTokens && (
        <Flex justifyContent="center" alignItems="center" mt={4}>
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
