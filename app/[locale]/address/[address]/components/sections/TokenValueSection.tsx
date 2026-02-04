import { Flex, Heading, Stack, Text, Skeleton } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { StackedTokenIcons } from '@/components/ui/StackedTokenIcons'
import { getTokenIconPath } from '@/lib/utils/tokens'
import { COMBINED_TOKENS } from '@/lib/constants/tokens'
import type { TokenValueRow } from '@/hooks/useAccountTokens'

interface TokenValueSectionProps {
  tokenValueRows: TokenValueRow[]
  totalValue: string
  isPending: boolean
}

export const TokenValueSection = ({ tokenValueRows, totalValue, isPending }: TokenValueSectionProps) => {
  const { t } = useTranslation()

  const items: DataCardGroupItem[] = tokenValueRows.map(token => {
    // Check if this is the combined B3TR/VOT3 row
    const isCombined = token.key === COMBINED_TOKENS.key

    if (isCombined) {
      return {
        title: COMBINED_TOKENS.symbols.join(' / '),
        children: (
          <Flex alignItems="center" gap={2}>
            <Text textStyle="bodyM" color="text-primary">
              {token.value}
            </Text>
            <StackedTokenIcons symbols={[...COMBINED_TOKENS.symbols]} size={16} />
          </Flex>
        ),
      }
    }

    // Regular token rendering
    const iconPath = getTokenIconPath(token.symbol)
    return {
      title: token.symbol,
      children: (
        <Flex alignItems="center" gap={2}>
          <Text textStyle="bodyM" color="text-primary">
            {token.value}
          </Text>
          {iconPath && <Image src={iconPath} alt={token.symbol} width={16} height={16} />}
        </Flex>
      ),
    }
  })

  return (
    <Stack gap={0}>
      <Heading as="h3" textStyle="bodyL" mb={4} color="text-primary">
        {t('Token Value')}{' '}
        <Text as="span" color="text-secondary">
          ({totalValue})
        </Text>
      </Heading>
      {isPending ? (
        <Skeleton height="120px" borderRadius="md" />
      ) : tokenValueRows.length === 0 ? (
        <Flex pt={4} pr={6} pb={4} pl={6} borderWidth="1px" borderColor="border-primary" borderRadius="md">
          <Text textStyle="bodyM" color="text-primary">
            {t('No tokens')}
          </Text>
        </Flex>
      ) : (
        <DataCardGroup items={items} singleCard variant="outline" mobileCardProps={{ flex: '0' }} />
      )}
    </Stack>
  )
}
