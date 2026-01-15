'use client'

import { Flex, Image, ImageProps, Text } from '@chakra-ui/react'
import Link from 'next/link'

export const Logo = ({ h = { base: '18px', md: '30px' } }: { h?: ImageProps['h'] }) => {
  return (
    <Link href="/">
      <Flex gap={2} alignItems="baseline">
        <Image src="/vechain-light.svg" alt="VeChain logo" h={h} w="auto" />

        <Text fontSize="10px" color="white" textTransform="uppercase" userSelect="none">
          {'Explorer'}
        </Text>
      </Flex>
    </Link>
  )
}
