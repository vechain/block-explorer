import { Box, Input, Text, VStack, Flex, Icon } from "@chakra-ui/react"
import { InputGroup } from "../ui/InputGroup"
import { LuArrowBigRight, LuBox, LuSearch } from "react-icons/lu"
import { FaLinode } from "react-icons/fa"

import InsightData from "./InisghtData"

const BlockchainInsightsComponent = () => {
  return (
    <Flex w="100%" m={4} justifyContent="center">
      <Flex w="60%" borderRadius="24px" bg="grey.700" gap={6} p={12}>
        <VStack flex={8} justify={"center"}>
          <Text textAlign={"left"} w={"100%"} fontSize="18px" color={"grey.200"} fontWeight={600}>
            Tracking Blockchain Insights and Sustainability Metrics
          </Text>
          <InputGroup w={"100%"} pt={4} startElement={<LuSearch />}>
            <Input
              size={"xl"}
              w={"80%"}
              borderRadius={"12px"}
              bg={"white"}
              color={"grey.400"}
              placeholder="Search transactions, blocks, addresses, contracts or VNS domains..."
              _placeholder={{ opacity: 0.7 }}
            />
          </InputGroup>
        </VStack>
        <Box flex="3" textAlign="center">
          <InsightData
            icon={
              <Icon mr={1} size={"md"} color={"grey.400"}>
                <LuBox />
              </Icon>
            }
            label="Block Number"
            value={"-----"}
          />
          <InsightData
            icon={
              <Icon mr={1} color={"grey.400"} size={"md"}>
                <LuArrowBigRight />
              </Icon>
            }
            label="Total Transactions"
            value={"-----"}
          />
          <InsightData
            icon={
              <Icon mr={2} size={"md"} color={"grey.400"}>
                <FaLinode />
              </Icon>
            }
            label="Validator Nodes"
            value={"-----"}
          />
        </Box>
      </Flex>
    </Flex>
  )
}

export default BlockchainInsightsComponent
