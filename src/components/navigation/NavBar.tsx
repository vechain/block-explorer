import React from "react"
import { Box, Flex, Button, Text, HStack, Image } from "@chakra-ui/react"
import { LuDownload } from "react-icons/lu"
import { ColorModeButton } from "@/components/ui/ColorMode.tsx"
import NetworkSwitcher from "../network/NetworkSwitcher"

const Navbar: React.FC = () => {
  return (
    <Box as="nav" px={6} py={4}>
      <Flex justify="space-between" align="center">
        <HStack gap={4}>
          <Box color={"white"}>
            <HStack>
              <Image color={"white"} height={"30px"} w={"30px"} src="Vector.png" />
              <Text fontSize="xl" fontWeight="bold" userSelect="none" cursor="default">
                VeChain
              </Text>
            </HStack>
            <Text fontSize="sm" textAlign="right" userSelect="none" cursor="default">
              Explorer
            </Text>
          </Box>
        </HStack>
        <HStack gap={4}>
          <Box>
            <Button color={"grey.600"} bg={"white"} borderColor={"grey.200"}>
              <LuDownload color="black" />
              <Text fontSize="sm" fontWeight="bold">
                <Text />
                Download VeWorld
              </Text>
            </Button>
          </Box>
          <NetworkSwitcher />
          <ColorModeButton />
        </HStack>
      </Flex>
    </Box>
  )
}

export default Navbar
