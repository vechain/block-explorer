'use client'

import { Box, Flex, Image, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { FiArrowUpRight } from 'react-icons/fi'
import { useColorMode } from '../theme/color-mode'
import { NetworkSelect } from './NetworkSelect'

export const Header = () => {
  useColorMode()
  return (
    <Flex as="header" justify="space-between" align="center" py={{ base: 0, md: 4 }}>
      <Box hideBelow="md">
        <Logo />
      </Box>
      <NavigationMenu />
    </Flex>
  )
}

const Logo = () => {
  return (
    <Link href="/">
      <Flex gap={2} alignItems="end">
        <Image src="/vechain-light.svg" h={{ base: '20px', md: '30px' }} w="auto" />

        <Text fontSize="10px" color="white" textTransform="uppercase" userSelect="none">
          Explorer
        </Text>
      </Flex>
    </Link>
  )
}

const NavigationMenu = () => {
  return (
    <Flex
      flex={{ base: 1, md: 0 }}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      gap={4}
      alignItems="center"
      px={4}
      py={2}>
      <Box hideFrom="md">
        <Logo />
      </Box>
      <Box hideBelow="md">
        <Link href="https://inspector.vecha.in/" target="_blank" rel="noopener noreferrer">
          <Flex gap={2} alignItems="center" justifyContent="center" p={4}>
            <Text fontSize="body-m" whiteSpace="nowrap">
              Inspect tool
            </Text>
            <FiArrowUpRight width={16} height={16} />
          </Flex>
        </Link>
      </Box>
      <NetworkSelect />
    </Flex>
  )
}
