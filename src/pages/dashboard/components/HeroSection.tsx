import { Text, Flex, Stack } from "@chakra-ui/react"
import { BlockNumberCard, TransactionsPerSecondCard, ClausesPerSecondCard } from "./InsightDataCard"
import { useTranslation } from "react-i18next"
import { SearchBar } from "./SearchBar"

export const HeroSection = () => {
  const { t } = useTranslation()

  return (
    <Stack py={16} px={40} bg="bg.subtle" rounded="xl" gap={24}>
      <Text maxW="700px" fontSize="5xl" fontWeight={600}>
        {t("tracking_blockchain_insights")}
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
