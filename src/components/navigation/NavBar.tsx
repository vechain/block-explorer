import { Link as RouterLink } from "react-router-dom"
import { Flex, Button, Text, Image, Link as ChakraLink, Group, Stack } from "@chakra-ui/react"
import { LuDownload } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { ColorModeButton } from "@/components/ui/theme/color-mode"
import { NetworkSelect } from "./NetworkSelect"
import { usePriceList } from "@/services/coin-api/price-list/hooks"

export const Navbar = () => {
  const { t } = useTranslation()
  const { data: priceList } = usePriceList()

  return (
    <Flex as="nav" justify="space-between" align="center">
      <RouterLink to="/">
        <Stack gap={0}>
          <Group gap={2}>
            <Image src="/vechain.svg" h="30px" w="30px" />
            <Text fontSize="xl" fontWeight="bold" userSelect="none">
              {t("vechain_title")}
            </Text>
          </Group>
          <Text fontSize="sm" textAlign="right" textTransform="uppercase" userSelect="none">
            {t("explorer")}
          </Text>
        </Stack>
      </RouterLink>

      {priceList && (
        <Flex gap={4} alignItems="center">
          <Text asChild fontSize="sm" color="fg.muted">
            <ChakraLink href="https://www.coingecko.com/fr/coins/vechain" target="_blank">
              VET: {priceList.vet.usd.toFixed(4).toLocaleString()} $
            </ChakraLink>
          </Text>
          <Text asChild fontSize="sm" color="fg.muted">
            <ChakraLink href="https://www.coingecko.com/fr/coins/vethor-token" target="_blank">
              VTHO: {priceList.vtho.usd.toFixed(4).toLocaleString()} $
            </ChakraLink>
          </Text>
          <Text asChild fontSize="sm" color="fg.muted">
            <ChakraLink href="https://www.coingecko.com/fr/coins/vebetterdao" target="_blank">
              B3TR: {priceList.b3tr.usd.toFixed(4).toLocaleString()} $
            </ChakraLink>
          </Text>
        </Flex>
      )}

      <Group gap={4}>
        <DownloadButton />
        <NetworkSelect />
        <ColorModeButton />
      </Group>
    </Flex>
  )
}

const downloadVeWorldHref = "https://www.veworld.net/"

const DownloadButton = () => {
  const { t } = useTranslation()

  return (
    <Button asChild bg="primary.500" color="gray.50">
      <ChakraLink href={downloadVeWorldHref} target="_blank" textDecoration="none">
        {t("download_button")}
        <LuDownload />
      </ChakraLink>
    </Button>
  )
}
