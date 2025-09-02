import { Flex, Stack, Text } from '@chakra-ui/react'
import { i18n } from '@/i18n/server'
import { BlockNumberCard, ClausesPerSecondCard, TransactionsPerSecondCard } from './InsightDataCard'
import { SearchBar } from './SearchBar'

export const HeroSection = async () => {
  const { t } = await i18n()

  return (
    <Stack py={16} px={40} bg="bg.subtle" rounded="xl" gap={24}>
      <Text maxW="700px" fontSize="5xl" fontWeight={600}>
        {t('tracking_blockchain_insights')}
      </Text>

      <SearchBar />

      <Flex gap={4}>
        <BlockNumberCard />
        <TransactionsPerSecondCard />
        <ClausesPerSecondCard />
      </Flex>
    </Stack>
  )
}
