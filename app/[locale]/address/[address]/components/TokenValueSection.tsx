import { Flex, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { TokenValueRow } from './TokenValueRow'
import type { TokenValueRow as TokenValueRowType } from '@/hooks/useAccountTokens'

interface TokenValueSectionProps {
  tokenValueRows: TokenValueRowType[]
  totalValue: string
  isPending: boolean
}

export const TokenValueSection = ({ tokenValueRows, totalValue, isPending }: TokenValueSectionProps) => {
  const { t } = useTranslation()

  return (
    <Stack gap={0}>
      <Heading as="h3" textStyle="bodyL" mb={4} color="text-primary">
        {t('Token Value')}{' '}
        <Text as="span" color="text-secondary">
          ({totalValue})
        </Text>
      </Heading>
      <Stack gap={0}>
        {isPending ? (
          <>
            <Skeleton height="60px" borderRadius="md" />
            <Skeleton height="60px" borderRadius="md" mt={2} />
          </>
        ) : tokenValueRows.length === 0 ? (
          <Flex pt={4} pr={6} pb={4} pl={6} borderWidth="1px" borderColor="border-primary" borderRadius="md">
            <Text textStyle="bodyM" color="text-primary">
              {t('No tokens')}
            </Text>
          </Flex>
        ) : (
          tokenValueRows.map((token, index) => (
            <TokenValueRow
              key={token.key}
              token={token}
              value={token.value}
              isFirst={index === 0}
              isLast={index === tokenValueRows.length - 1}
            />
          ))
        )}
      </Stack>
    </Stack>
  )
}
