import { Box, Text, VStack, Flex, Icon } from "@chakra-ui/react"
import { LuArrowBigRight, LuBox } from "react-icons/lu"
import { FaLinode } from "react-icons/fa"
import InsightData from "./InsightData"
import { SearchBar } from "@/components/search/SearchBar"
import { useBestBlock } from "@/hooks/thor/useBestBlock"
import { useTranslation } from "react-i18next"

export const BlockchainInsightsComponent = () => {
  const { data: bestBlock, isLoading } = useBestBlock()
  const { t } = useTranslation()

  return (
    <Flex w="100%" m={4} justifyContent="center">
      <Flex w="80%" borderRadius="24px" bg="grey.700" gap={6} p={12}>
        <VStack flex={8} justify={"center"}>
          <Text textAlign={"left"} w={"100%"} fontSize="18px" color={"grey.200"} fontWeight={600}>
            {t("tracking_blockchain_insights")}
          </Text>
          <SearchBar />
        </VStack>
        <Box flex="4" textAlign="center">
          <InsightData
            icon={
              <Icon mr={1} size={"md"} color={"grey.400"}>
                <LuBox />
              </Icon>
            }
            label={t("block_number")}
            value={bestBlock?.number.toLocaleString()}
            loading={isLoading}
          />
          <InsightData
            icon={
              <Icon mr={1} color={"grey.400"} size={"md"}>
                <LuArrowBigRight />
              </Icon>
            }
            label={t("total_transactions")}
            value={"-----"}
          />
          <InsightData
            icon={
              <Icon mr={2} size={"md"} color={"grey.400"}>
                <FaLinode />
              </Icon>
            }
            label={t("validator_nodes")}
            value={"-----"}
          />
        </Box>
      </Flex>
    </Flex>
  )
}
