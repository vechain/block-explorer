import { Button, Link as ChakraLink, Flex, Group, Image, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { LuDownload } from 'react-icons/lu'
import { ColorModeButton } from '@/components/theme/color-mode'
import { i18n } from '@/i18n/server'
import { NetworkSelect } from './NetworkSelect'
import { TokenPrices } from './token-prices'

export const Navbar = async () => {
  const { t } = await i18n()

  return (
    <Flex as="nav" justify="space-between" align="center">
      <Link href="/">
        <Stack gap={0}>
          <Group gap={2}>
            <Image src="/vechain.svg" h="30px" w="30px" />
            <Text fontSize="xl" fontWeight="bold" userSelect="none">
              VeChain
            </Text>
          </Group>
          <Text fontSize="sm" textAlign="right" textTransform="uppercase" userSelect="none">
            {t('explorer')}
          </Text>
        </Stack>
      </Link>

      <TokenPrices />

      <Group gap={4}>
        <DownloadButton />
        <NetworkSelect />
        <ColorModeButton />
      </Group>
    </Flex>
  )
}

const downloadVeWorldHref = 'https://www.veworld.net/'

const DownloadButton = async () => {
  const { t } = await i18n()

  return (
    <Button asChild bg="primary.500" color="gray.50">
      <ChakraLink href={downloadVeWorldHref} target="_blank" textDecoration="none">
        {t('download_button')}
        <LuDownload />
      </ChakraLink>
    </Button>
  )
}
