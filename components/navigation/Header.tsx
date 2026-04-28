'use client'

import { Box, Flex, HStack, Separator, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiArrowUpRight, FiMenu } from 'react-icons/fi'
import { i18nConfig, type Locale } from '@/i18n/config'
import { languageNames } from '@/i18n/utils'
import { NetworkName } from '@/lib/constants/network'
import { getRuntimeConfig } from '@/lib/runtime-config/get'
import { useSettingsStore } from '@/lib/stores/settings'
import { useNetworkAwareHref } from '@/hooks/useNetworkAwareHref'
import { useColorMode } from '../theme/color-mode'
import { MotionBox } from '../ui/MotionBox'
import { CurrencyModal } from './CurrencyModal'
import { DevModeModal } from './DevModeModal'
import { LanguageModal } from './LanguageModal'
import { NetworkSelect } from './NetworkSelect'
import { SearchBar } from './SearchBar'
import { Logo } from '../Logo'
import { CURRENCIES } from '@/lib/constants/currencies'

export const Header = () => {
  useColorMode()
  return (
    <VStack alignItems="stretch">
      <Flex as="header" justify="space-between" align="center" py={{ base: 0, md: 4 }} gap={6}>
        <Logo />

        <SearchBar hideBelow="md" flex={1} />

        <NavigationMenu />
      </Flex>
      <SearchBar hideFrom="md" flex={1} mb={8} />
    </VStack>
  )
}

const NavigationMenu = () => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false)
  const [isDevModeModalOpen, setIsDevModeModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const queryClient = useQueryClient()
  const currentLocale = (params.locale as Locale) || i18nConfig.defaultLocale
  const currentLanguage = languageNames[currentLocale]
  const { activeNetwork, currency, isDevMode, setIsDevMode } = useSettingsStore()
  const { allowDevMode } = getRuntimeConfig()
  const statsHref = useNetworkAwareHref('/stats')
  const tokensHref = useNetworkAwareHref('/tokens')

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleLanguageClick = () => {
    setIsMenuOpen(false)
    setIsLanguageModalOpen(true)
  }

  const handleCurrencyClick = () => {
    setIsMenuOpen(false)
    setIsCurrencyModalOpen(true)
  }

  const handleDevModeSettingsClick = () => {
    setIsMenuOpen(false)
    setIsDevModeModalOpen(true)
  }

  const handleDevModeToggle = () => {
    const nextIsDevMode = !isDevMode
    const shouldInvalidateQueries = !nextIsDevMode && activeNetwork.name === NetworkName.SOLO

    setIsDevMode(nextIsDevMode)

    if (!nextIsDevMode) {
      setIsDevModeModalOpen(false)
    }

    if (shouldInvalidateQueries) {
      queryClient.invalidateQueries()
    }
  }

  const currencyInfo = CURRENCIES[currency]
  return (
    <>
      <Flex
        justifyContent={{ base: 'space-between', md: 'flex-end' }}
        gap={{ base: 2, md: 4 }}
        alignItems="center"
        py={2}
        position="relative"
      >
        <NetworkSelect />
        <Box ref={menuRef}>
          <Box position="relative">
            <Box
              as="button"
              aria-label={isMenuOpen ? t('Close navigation menu') : t('Open navigation menu')}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen(prev => !prev)}
              bg="transparent"
              cursor="pointer"
              borderRadius="full"
              border="1px solid"
              borderColor="border-primary"
              p={2}
            >
              <FiMenu size={20} aria-hidden="true" />
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
                border="1px solid"
                borderColor="border-primary"
                bg="bg-primary"
                backdropFilter="blur(32px)"
                borderRadius="md"
                boxShadow="lg"
                py={2}
                px={3}
                zIndex={10}
                minW="160px"
              >
                <Link href={statsHref} onClick={() => setIsMenuOpen(false)}>
                  <Flex gap={2} alignItems="center" py={2}>
                    <Text fontSize="body-m" whiteSpace="nowrap">
                      {t('Metrics')}
                    </Text>
                  </Flex>
                </Link>
                <Separator />
                <Link href={tokensHref} onClick={() => setIsMenuOpen(false)}>
                  <Flex gap={2} alignItems="center" py={2}>
                    <Text fontSize="body-m" whiteSpace="nowrap">
                      {t('Tokens')}
                    </Text>
                  </Flex>
                </Link>
                <Separator />
                <Link href="https://inspector.vecha.in/" target="_blank" rel="noopener noreferrer">
                  <Flex gap={2} alignItems="center" py={2}>
                    <Text fontSize="body-m" whiteSpace="nowrap">
                      {t('Inspect tool')}
                    </Text>
                    <FiArrowUpRight width={16} height={16} />
                  </Flex>
                </Link>
                <Separator />
                <Box
                  as="button"
                  onClick={handleLanguageClick}
                  w="100%"
                  cursor="pointer"
                  aria-label={t('Change language, current: {{language}}', { language: currentLanguage.native })}
                >
                  <Flex gap={2} alignItems="center" py={2}>
                    <Text fontSize="body-m" whiteSpace="nowrap" aria-hidden="true">
                      {currentLanguage.flag}
                    </Text>
                    <Text fontSize="body-m" whiteSpace="nowrap">
                      {currentLanguage.native}
                    </Text>
                  </Flex>
                </Box>
                <Separator />

                <Box
                  as="button"
                  onClick={handleCurrencyClick}
                  w="100%"
                  cursor="pointer"
                  aria-label={t('Change currency, current: {{currency}}', {
                    currency: currencyInfo.code.toUpperCase(),
                  })}
                >
                  <HStack gap={2} alignItems="center" py={2}>
                    <Text fontSize="body-m" whiteSpace="nowrap" aria-hidden="true">
                      {currencyInfo.symbol}
                    </Text>
                    <Text fontSize="body-m" whiteSpace="nowrap" textTransform="uppercase">
                      {currencyInfo.code}
                    </Text>
                  </HStack>
                </Box>
                {allowDevMode && (
                  <>
                    <Separator />
                    <Flex justify="space-between" alignItems="center" gap={3} py={2}>
                      <Text fontSize="body-m" whiteSpace="nowrap">
                        {t('Dev mode')}
                      </Text>
                      <Box
                        as="button"
                        onClick={handleDevModeToggle}
                        role="switch"
                        aria-checked={isDevMode}
                        aria-label={t('Dev mode')}
                        bg="transparent"
                        borderRadius="full"
                      >
                        <Flex
                          w="46px"
                          h="26px"
                          p="3px"
                          bg={isDevMode ? 'accent-primary' : 'bg-secondary'}
                          borderRadius="full"
                          justifyContent={isDevMode ? 'flex-end' : 'flex-start'}
                          alignItems="center"
                          transition="background-color 0.2s ease"
                        >
                          <Box w="20px" h="20px" bg="white" borderRadius="full" />
                        </Flex>
                      </Box>
                    </Flex>
                    {isDevMode && (
                      <>
                        <Separator />
                        <Box as="button" onClick={handleDevModeSettingsClick} w="100%" cursor="pointer">
                          <Flex gap={2} alignItems="center" py={2}>
                            <Text fontSize="body-m" whiteSpace="nowrap">
                              {t('Configure Solo endpoints')}
                            </Text>
                          </Flex>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </MotionBox>
            )}
          </Box>
        </Box>
      </Flex>
      <LanguageModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} />
      <CurrencyModal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} />
      <DevModeModal isOpen={isDevModeModalOpen} onClose={() => setIsDevModeModalOpen(false)} />
    </>
  )
}
