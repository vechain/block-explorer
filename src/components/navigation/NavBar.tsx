import { Link as RouterLink } from "react-router-dom"
import { Flex, Button, Text, Image, Link as ChakraLink, Group, Stack } from "@chakra-ui/react"
import { LuDownload } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { ColorModeButton } from "@/components/ui/theme/color-mode"
import { NetworkSelect } from "./NetworkSelect"
import { useVetVthoUsdPrice } from "@/services/coingecko/vet-vtho-usd-price/hooks"

const downloadVeWorldHref =
  "https://chromewebstore.google.com/detail/veworld/ffondjhiilhjpmfakjbejdgbemolaaho?utm_source=landing_page&utm_medium=website&utm_campaign=vechain_communication"

export const Navbar = () => {
  const { t } = useTranslation()
  const { data: usdPrice } = useVetVthoUsdPrice()

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

      <Flex gap={4} alignItems="center">
        <Text fontSize="sm" color="fg.muted">
          VET: {usdPrice?.vechain.usd.toFixed(4).toLocaleString()} $
        </Text>
        <Text fontSize="sm" color="fg.muted">
          VTHO: {usdPrice?.["vethor-token"].usd.toFixed(4).toLocaleString()} $
        </Text>
      </Flex>

      <Group gap={4}>
        <DownloadButton />
        <NetworkSelect />
        <ColorModeButton />
      </Group>
    </Flex>
  )
}

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
