'use client'

import { useTranslation } from 'react-i18next'
import { Link } from '@chakra-ui/react'
import { Flex, Image, ImageProps, Text } from '@chakra-ui/react'

export const Logo = ({ h = { base: '18px', md: '30px' } }: { h?: ImageProps['h'] }) => {
  const { t } = useTranslation()
  return (
    <Link href="/">
      <Flex gap={2} alignItems="end">
        <Image src="/vechain-light.svg" alt="VeChain logo" h={h} w="auto" />

        <Text fontSize="10px" color="white" textTransform="uppercase" userSelect="none">
          {t('Explorer')}
        </Text>
      </Flex>
    </Link>
  )
}
