'use client'

import { Box, Flex, Image, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiArrowUpRight, FiMenu } from 'react-icons/fi'
import { i18nConfig, type Locale } from '@/i18n/config'
import { languageNames } from '@/i18n/utils'
import { useColorMode } from '../theme/color-mode'
import { MotionBox } from '../ui/MotionBox'
import { LanguageModal } from './LanguageModal'
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
  const { t } = useTranslation()
  return (
    <Link href="/">
      <Flex gap={2} alignItems="end">
        <Image src="/vechain-light.svg" alt="VeChain logo" h={{ base: '18px', md: '30px' }} w="auto" />

        <Text fontSize="10px" color="white" textTransform="uppercase" userSelect="none">
          {t('Explorer')}
        </Text>
      </Flex>
    </Link>
  )
}

const NavigationMenu = () => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const params = useParams()
  const currentLocale = (params.locale as Locale) || i18nConfig.defaultLocale
  const currentLanguage = languageNames[currentLocale]

  const handleLanguageClick = () => {
    setIsMenuOpen(false)
    setIsLanguageModalOpen(true)
  }

  return (
    <>
      <Flex
        flex={{ base: 1, md: 0 }}
        justifyContent={{ base: 'space-between', md: 'flex-end' }}
        gap={{ base: 2, md: 4 }}
        alignItems="center"
        py={2}
        position="relative"
      >
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
              p={2}
            >
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
                backdropFilter="blur(32px)"
                borderRadius="md"
                boxShadow="lg"
                py={2}
                px={3}
                zIndex={10}
                minW="160px"
              >
                <Link href="https://inspector.vecha.in/" target="_blank" rel="noopener noreferrer">
                  <Flex gap={2} alignItems="center" py={1}>
                    <Text fontSize="body-m" whiteSpace="nowrap">
                      {t('Inspect tool')}
                    </Text>
                    <FiArrowUpRight width={16} height={16} />
                  </Flex>
                </Link>
                <Box
                  as="button"
                  onClick={handleLanguageClick}
                  w="100%"
                  cursor="pointer"
                  borderTopWidth="1px"
                  borderColor="border-surface"
                  mt={2}
                  pt={2}
                >
                  <Flex gap={2} alignItems="center" py={1}>
                    <Text fontSize="body-m" whiteSpace="nowrap">
                      {currentLanguage.flag}
                    </Text>
                    <Text fontSize="body-m" whiteSpace="nowrap">
                      {currentLanguage.native}
                    </Text>
                  </Flex>
                </Box>
              </MotionBox>
            )}
          </Box>
        </Box>
      </Flex>
      <LanguageModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
    </>
  )
}
