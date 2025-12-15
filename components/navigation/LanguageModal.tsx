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
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg-card-surface-2"
            backdropFilter="blur(32px)"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border-surface"
            maxW="400px"
            w="90vw"
            p={0}>
            <Dialog.Header p={4} borderBottomWidth="1px" borderColor="border-surface">
              <Flex justify="space-between" align="center">
                <Flex align="center" gap={2}>
                  <LuGlobe size={20} />
                  <Dialog.Title textStyle="bodyL" fontWeight="semibold">
                    {t('Select Language')}
                  </Dialog.Title>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm" p={1} onClick={onClose}>
                    <LuX size={20} />
                  </Button>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>

            <Dialog.Body p={0} maxH="50vh" overflow="auto">
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
                      bg={isActive ? 'bg-surface-alt' : 'transparent'}
                      _hover={{ bg: 'bg-surface-alt' }}
                      cursor="pointer"
                      transition="background 0.2s"
                      borderBottomWidth="1px"
                      borderColor="border-surface"
                      css={{ '&:last-child': { borderBottom: 'none' } }}>
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
                        {isActive && <LuCheck size={20} color="var(--chakra-colors-highlight-primary)" />}
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
