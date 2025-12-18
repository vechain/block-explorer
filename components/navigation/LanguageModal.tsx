'use client'

import { Box, Button, Dialog, Flex, Portal, Text, VStack } from '@chakra-ui/react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LuCheck, LuGlobe, LuX } from 'react-icons/lu'
import { i18nConfig, type Locale } from '@/i18n/config'
import { getLocalePath, languageNames } from '@/i18n/utils'

interface LanguageModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LanguageModal = ({ isOpen, onClose }: LanguageModalProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = (params.locale as Locale) || i18nConfig.defaultLocale

  const handleLanguageChange = (locale: Locale) => {
    const newPath = getLocalePath(locale, pathname)
    router.push(newPath)
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner alignItems={{ base: 'flex-end', md: 'center' }} px={{ base: 0, md: 4 }}>
          <Dialog.Content
            mb={{ base: 0, md: 'inherit' }}
            bg="bg-primary"
            backdropFilter="blur(32px)"
            borderTopLeftRadius={{ base: '2xl', md: 'xl' }}
            borderTopRightRadius={{ base: '2xl', md: 'xl' }}
            borderBottomLeftRadius={{ base: 0, md: 'xl' }}
            borderBottomRightRadius={{ base: 0, md: 'xl' }}
            borderWidth="1px"
            borderColor="border-primary"
            maxW={{ base: '100vw', md: '400px' }}
            w={{ base: '100vw', md: '90vw' }}
            maxH={{ base: '85vh', md: 'unset' }}
            overflow="hidden"
            p={0}
          >
            <Dialog.Header p={4} borderBottomWidth="1px" borderColor="border-primary">
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={2}>
                  <LuGlobe size={20} />
                  <Dialog.Title textStyle="bodyL" fontWeight="semibold">
                    {t('Select Language')}
                  </Dialog.Title>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm" minW="44px" minH="44px" p={1} onClick={onClose}>
                    <LuX size={20} />
                  </Button>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>

            <Dialog.Body p={0} maxH={{ base: '70vh', md: '50vh' }} overflow="auto">
              <VStack gap={0} align="stretch">
                {i18nConfig.locales.map(locale => {
                  const isActive = locale === currentLocale
                  const langInfo = languageNames[locale]

                  return (
                    <Box
                      key={locale}
                      as="button"
                      onClick={() => handleLanguageChange(locale)}
                      w="100%"
                      p={4}
                      bg={isActive ? 'bg-secondary' : 'transparent'}
                      _hover={{ bg: 'bg-secondary' }}
                      cursor="pointer"
                      transition="background 0.2s"
                      borderBottomWidth="1px"
                      borderColor="border-primary"
                      css={{ '&:last-child': { borderBottom: 'none' } }}
                    >
                      <Flex justify="space-between" align="center">
                        <Flex align="center" gap={3}>
                          <Text fontSize="xl">{langInfo.flag}</Text>
                          <VStack align="start" gap={0}>
                            <Text textStyle="bodyM" fontWeight={isActive ? 'semibold' : 'normal'}>
                              {langInfo.native}
                            </Text>
                            <Text textStyle="bodyS" color="text-secondary">
                              {langInfo.english}
                            </Text>
                          </VStack>
                        </Flex>
                        {isActive && <LuCheck size={20} color="var(--chakra-colors-accent-primary)" />}
                      </Flex>
                    </Box>
                  )
                })}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
