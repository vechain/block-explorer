import { Box, Input, Text, VStack, Flex, Icon } from "@chakra-ui/react"
import { InputGroup } from "../ui/InputGroup"
import { LuArrowBigRight, LuBox, LuSearch } from "react-icons/lu"
import { FaLinode } from "react-icons/fa"
import InsightData from "./InisghtData"
import { useBestBlock } from "@/hooks/blocks/useBestBlock.ts"
import { useTranslation } from "react-i18next"

const BlockchainInsightsComponent = () => {
  const { bestBlock, isBestBlockLoading } = useBestBlock()
  const { t } = useTranslation()

  return (
    <Flex w="100%" m={4} justifyContent="center">
      <Flex w="80%" borderRadius="24px" bg="grey.700" gap={6} p={12}>
        <VStack flex={8} justify={"center"}>
          <Text textAlign={"left"} w={"100%"} fontSize="18px" color={"grey.200"} fontWeight={600}>
            {t("tracking_blockchain_insights")}
          </Text>
          <InputGroup w={"100%"} pt={4} startElement={<LuSearch />}>
            <Input
              size={"xl"}
              w={"80%"}
              borderRadius={"12px"}
              bg={"white"}
              color={"grey.400"}
              placeholder={t("search_placeholder")}
              _placeholder={{ opacity: 0.7 }}
            />
          </InputGroup>
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
            loading={isBestBlockLoading}
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

export default BlockchainInsightsComponent
