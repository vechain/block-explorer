import { Flex, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { TokenBalanceRow } from './TokenBalanceRow'
import type { TokenBalanceRow as TokenBalanceRowType } from '@/hooks/useAccountTokens'

interface TokenBalanceSectionProps {
  tokenBalanceRows: TokenBalanceRowType[]
  isPending: boolean
}

export const TokenBalanceSection = ({ tokenBalanceRows, isPending }: TokenBalanceSectionProps) => {
  const { t } = useTranslation()

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
          <Flex pt={4} pr={6} pb={4} pl={6} borderWidth="1px" borderColor="border-primary" borderRadius="md">
            <Text textStyle="bodyM" color="text-primary">
              {t('No tokens')}
            </Text>
          </Flex>
        ) : (
          tokenBalanceRows.map((token, index) => (
            <TokenBalanceRow
              key={token.key}
              token={token}
              balance={token.balance}
              isFirst={index === 0}
              isLast={index === tokenBalanceRows.length - 1}
            />
          ))
        )}
      </Stack>
    </Stack>
  )
}
