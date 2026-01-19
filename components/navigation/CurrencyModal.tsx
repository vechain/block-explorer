'use client'

import { Box, Button, Dialog, Flex, Portal, Text, VStack } from '@chakra-ui/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LuCheck, LuX } from 'react-icons/lu'
import { Currency, useSettingsStore } from '@/lib/stores/settings'
import { CURRENCIES } from '@/lib/constants/currencies'
import { currencyConfig } from '@/lib/constants/currency-config'

interface CurrencyModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CurrencyModal = ({ isOpen, onClose }: CurrencyModalProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { currency, setCurrency } = useSettingsStore()

  const handleCurrencyChange = (next: Currency) => {
    setCurrency(next)
    // Set the currency cookie for middleware/SSR to read
    document.cookie = `${currencyConfig.cookieName}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    // Update the URL with the new currency parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set('currency', next)
    router.push(`${pathname}?${params.toString()}`)
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
                  <Dialog.Title textStyle="bodyL" fontWeight="semibold">
                    {t('Select Currency')}
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
                {(Object.values(Currency) as Currency[]).map(curr => {
                  const isActive = curr === currency
                  const info = CURRENCIES[curr]

                  return (
                    <Box
                      key={curr}
                      as="button"
                      onClick={() => handleCurrencyChange(curr)}
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
                          <Text fontSize="xl">{info.symbol}</Text>
                          <Text
                            textStyle="bodyM"
                            fontWeight={isActive ? 'semibold' : 'normal'}
                            textTransform={'uppercase'}
                          >
                            {info.code}
                          </Text>
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
