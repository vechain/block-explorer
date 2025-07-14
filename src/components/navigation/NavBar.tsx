import { Link as RouterLink } from "react-router-dom"
import { Flex, Button, Text, Image, Link as ChakraLink, Group, Stack } from "@chakra-ui/react"
import { LuDownload } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { ColorModeButton } from "@/components/ui/ColorMode.tsx"
import { NetworkSelect } from "./NetworkSelect"

const downloadVeWorldHref =
  "https://chromewebstore.google.com/detail/veworld/ffondjhiilhjpmfakjbejdgbemolaaho?utm_source=landing_page&utm_medium=website&utm_campaign=vechain_communication"

export const Navbar = () => {
  const { t } = useTranslation()

  return (
    <Flex as="nav" py={10} justify="space-between" align="center">
      <RouterLink to="/">
        <Stack gap={0}>
          <Group gap={2}>
            <Image src="vechain.svg" h="30px" w="30px" />
            <Text fontSize="xl" fontWeight="bold" userSelect="none">
              {t("vechain_title")}
            </Text>
          </Group>
          <Text fontSize="sm" textAlign="right" textTransform="uppercase" userSelect="none">
            {t("explorer")}
          </Text>
        </Stack>
      </RouterLink>

      <Group gap={4}>
        <Button asChild bg="bg.inverted" color="fg.inverted">
          <ChakraLink href={downloadVeWorldHref} target="_blank" textDecoration="none">
            {t("download_button")}
            <LuDownload />
          </ChakraLink>
        </Button>
        <NetworkSelect />
        <ColorModeButton />
      </Group>
    </Flex>
  )
}
