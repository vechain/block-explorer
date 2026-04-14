'use client'

import { Button, Dialog, Flex, Input, Portal, Text, VStack } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuSettings2, LuX } from 'react-icons/lu'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import {
  DEFAULT_SOLO_INDEXER_URL,
  DEFAULT_SOLO_NODE_URL,
  isValidHttpUrl,
  isValidIndexerBaseUrl,
  normalizeConfigUrl,
} from '@/lib/utils/runtime-network'

interface DevModeModalProps {
  isOpen: boolean
  onClose: () => void
}

const getNodeUrlError = (value: string) => {
  if (!value.trim()) return 'Enter a valid URL'

  return isValidHttpUrl(normalizeConfigUrl(value)) ? null : 'Enter a valid URL'
}

const getIndexerUrlError = (value: string) => {
  if (!value.trim()) return 'Enter a valid URL'

  const normalizedUrl = normalizeConfigUrl(value)
  if (!isValidHttpUrl(normalizedUrl)) return 'Enter a valid URL'
  if (!isValidIndexerBaseUrl(normalizedUrl)) return 'Indexer URL must not include /api or /v'

  return null
}

export const DevModeModal = ({ isOpen, onClose }: DevModeModalProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { activeNetwork, setSoloIndexerUrl, setSoloNodeUrl, soloIndexerUrl, soloNodeUrl } = useSettingsStore()
  const [draftSoloNodeUrl, setDraftSoloNodeUrl] = useState(soloNodeUrl)
  const [draftSoloIndexerUrl, setDraftSoloIndexerUrl] = useState(soloIndexerUrl)

  useEffect(() => {
    if (!isOpen) return

    setDraftSoloNodeUrl(soloNodeUrl)
    setDraftSoloIndexerUrl(soloIndexerUrl)
  }, [isOpen, soloIndexerUrl, soloNodeUrl])

  const soloNodeUrlError = useMemo(() => getNodeUrlError(draftSoloNodeUrl), [draftSoloNodeUrl])
  const soloIndexerUrlError = useMemo(() => getIndexerUrlError(draftSoloIndexerUrl), [draftSoloIndexerUrl])
  const isSaveDisabled = Boolean(soloNodeUrlError || soloIndexerUrlError)

  const handleSave = () => {
    if (isSaveDisabled) return

    setSoloNodeUrl(normalizeConfigUrl(draftSoloNodeUrl))
    setSoloIndexerUrl(normalizeConfigUrl(draftSoloIndexerUrl))

    if (activeNetwork.name === NetworkName.SOLO) {
      queryClient.invalidateQueries()
    }

    onClose()
  }

  const handleReset = () => {
    setDraftSoloNodeUrl(DEFAULT_SOLO_NODE_URL)
    setDraftSoloIndexerUrl(DEFAULT_SOLO_INDEXER_URL)
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
            maxW={{ base: '100vw', md: '560px' }}
            w={{ base: '100vw', md: '90vw' }}
            maxH={{ base: '85vh', md: 'unset' }}
            overflow="hidden"
            p={0}
          >
            <Dialog.Header p={4} borderBottomWidth="1px" borderColor="border-primary">
              <Flex justify="space-between" align="center" gap={4}>
                <Flex align="center" gap={2}>
                  <LuSettings2 size={20} />
                  <Dialog.Title textStyle="bodyL" fontWeight="semibold">
                    {t('Configure Solo endpoints')}
                  </Dialog.Title>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm" minW="44px" minH="44px" p={1} onClick={onClose}>
                    <LuX size={20} />
                  </Button>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>

            <Dialog.Body p={4}>
              <VStack align="stretch" gap={4}>
                <VStack align="stretch" gap={2}>
                  <Text textStyle="bodyMSemibold">{t('Solo node URL')}</Text>
                  <Input
                    type="url"
                    value={draftSoloNodeUrl}
                    onChange={event => setDraftSoloNodeUrl(event.target.value)}
                    aria-invalid={Boolean(soloNodeUrlError)}
                  />
                  {soloNodeUrlError && (
                    <Text color="red.300" textStyle="bodyS">
                      {t(soloNodeUrlError)}
                    </Text>
                  )}
                </VStack>

                <VStack align="stretch" gap={2}>
                  <Text textStyle="bodyMSemibold">{t('Solo indexer URL')}</Text>
                  <Input
                    type="url"
                    value={draftSoloIndexerUrl}
                    onChange={event => setDraftSoloIndexerUrl(event.target.value)}
                    aria-invalid={Boolean(soloIndexerUrlError)}
                  />
                  {soloIndexerUrlError && (
                    <Text color="red.300" textStyle="bodyS">
                      {t(soloIndexerUrlError)}
                    </Text>
                  )}
                </VStack>

                <Flex justify="space-between" gap={3} pt={2} flexWrap="wrap">
                  <Button variant="outline" onClick={handleReset}>
                    {t('Reset')}
                  </Button>
                  <Button onClick={handleSave} disabled={isSaveDisabled}>
                    {t('Save')}
                  </Button>
                </Flex>
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
