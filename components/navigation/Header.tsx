'use client'

import { Box, Flex, Image, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useState } from 'react'
import { FiArrowUpRight, FiMenu } from 'react-icons/fi'
import { useColorMode } from '../theme/color-mode'
import { MotionBox } from '../ui/MotionBox'
import { NetworkSelect } from './NetworkSelect'
import { SearchBar } from './SearchBar'

export const Header = () => {
  useColorMode()
  return (
    <Flex as="header" justify="space-between" align="center" py={{ base: 0, md: 4 }} gap={6}>
      <Box hideBelow="md">
        <Logo />
      </Box>
      <Box hideBelow="md" flex={1}>
        <SearchBar />
      </Box>
      <NavigationMenu />
    </Flex>
  )
}

const Logo = () => {
  return (
    <Link href="/">
      <Flex gap={2} alignItems="end">
        <Image src="/vechain-light.svg" h={{ base: '18px', md: '30px' }} w="auto" />

        <Text fontSize="10px" color="white" textTransform="uppercase" userSelect="none">
          Explorer
        </Text>
      </Flex>
    </Link>
  )
}

const NavigationMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Flex
      flex={{ base: 1, md: 0 }}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      gap={{ base: 2, md: 4 }}
      alignItems="center"
      py={2}
      position="relative">
      <Box hideFrom="md" display="flex" alignItems="center" gap={2}>
        <Logo />
      </Box>

      <NetworkSelect />
      <Box>
        <Box position="relative">
          <Box
            as="button"
            aria-label="Open navigation menu"
            onClick={() => setIsMenuOpen(prev => !prev)}
            bg="transparent"
            cursor="pointer"
            borderRadius="full"
            border="1px solid var(--chakra-colors-border-surface-2)"
            p={2}>
            <FiMenu size={20} />
          </Box>
          {isMenuOpen && (
            <MotionBox
              animate={{
                opacity: 1,
                y: 0,
              }}
              initial={{
                opacity: 0,
                y: -10,
              }}
              position="absolute"
              right={0}
              mt={2}
              border="1px solid"
              borderColor="bg-card-surface-2"
              bg="bg-card-surface-2"
              borderRadius="md"
              boxShadow="lg"
              py={2}
              px={3}
              zIndex={10}>
              <Link href="https://inspector.vecha.in/" target="_blank" rel="noopener noreferrer">
                <Flex gap={2} alignItems="center">
                  <Text fontSize="body-m" whiteSpace="nowrap">
                    Inspect tool
                  </Text>
                  <FiArrowUpRight width={16} height={16} />
                </Flex>
              </Link>
            </MotionBox>
          )}
        </Box>
      </Box>
    </Flex>
  )
}
