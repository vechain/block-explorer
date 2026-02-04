'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, Dialog, Flex, Input, Portal, Progress, Text, VStack } from '@chakra-ui/react'
import { LuDownload, LuX } from 'react-icons/lu'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { generateAndDownloadTransfersCsv, generateExportFilename } from '@/lib/utils/csv-export'
import { fetchAllTransfersForExport, type ExportProgress } from '@/services/veworld-indexer/export-transfers'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'

interface ExportTransfersModalProps {
  isOpen: boolean
  onClose: () => void
  address: AddressString
}

type ExportState = 'idle' | 'fetching' | 'generating' | 'complete' | 'error'

export const ExportTransfersModal = ({ isOpen, onClose, address }: ExportTransfersModalProps) => {
  const { t } = useTranslation()
  const { activeNetwork } = useSettingsStore()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Date inputs - default to last 30 days
  const defaultEndDate = new Date()
  const defaultStartDate = new Date()
  defaultStartDate.setDate(defaultStartDate.getDate() - 30)

  const [startDate, setStartDate] = useState<string>(formatDateForInput(defaultStartDate))
  const [endDate, setEndDate] = useState<string>(formatDateForInput(defaultEndDate))

  // Export state
  const [exportState, setExportState] = useState<ExportState>('idle')
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transfers, setTransfers] = useState<IndexerTransfer[]>([])

  // Validation
  const today = formatDateForInput(new Date())
  const isValidDateRange = useMemo(() => {
    if (!startDate || !endDate) return false
    return startDate <= endDate && endDate <= today
  }, [startDate, endDate, today])

  const handleStartExport = useCallback(async () => {
    if (!isValidDateRange) return

    setExportState('fetching')
    setProgress(null)
    setErrorMessage(null)
    setTransfers([])

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const fetchedTransfers = await fetchAllTransfersForExport({
        networkName: activeNetwork.name,
        address,
        startDate: new Date(`${startDate}T00:00:00Z`),
        endDate: new Date(`${endDate}T23:59:59Z`), // Include the entire end date (UTC)
        onProgress: setProgress,
        signal: abortControllerRef.current.signal,
      })

      if (abortControllerRef.current?.signal.aborted) {
        setExportState('idle')
        return
      }

      setTransfers(fetchedTransfers)

      if (fetchedTransfers.length === 0) {
        setExportState('complete')
        return
      }

      // Generate and download CSV
      setExportState('generating')
      generateAndDownloadTransfersCsv({
        transfers: fetchedTransfers,
        accountAddress: address,
        networkName: activeNetwork.name,
        filename: generateExportFilename(address, new Date(`${startDate}T00:00:00Z`), new Date(`${endDate}T23:59:59Z`)),
      })

      setExportState('complete')
    } catch (error) {
      if (error instanceof Error && error.message === 'Export cancelled') {
        setExportState('idle')
        return
      }

      setErrorMessage(error instanceof Error ? error.message : t('An error occurred'))
      setExportState('error')
    }
  }, [isValidDateRange, activeNetwork.name, address, startDate, endDate, t])

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setExportState('idle')
    setProgress(null)
  }, [])

  const handleClose = useCallback(() => {
    handleCancel()
    onClose()
  }, [handleCancel, onClose])

  const handleRetry = useCallback(() => {
    setExportState('idle')
    setErrorMessage(null)
  }, [])

  const handleDownloadAgain = useCallback(() => {
    if (transfers.length === 0) return

    setExportState('generating')
    try {
      generateAndDownloadTransfersCsv({
        transfers,
        accountAddress: address,
        networkName: activeNetwork.name,
        filename: generateExportFilename(address, new Date(`${startDate}T00:00:00Z`), new Date(`${endDate}T23:59:59Z`)),
      })
      setExportState('complete')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('An error occurred'))
      setExportState('error')
    }
  }, [transfers, address, activeNetwork.name, startDate, endDate, t])

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && handleClose()}>
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
            maxW={{ base: '100vw', md: '450px' }}
            w={{ base: '100vw', md: '90vw' }}
            maxH={{ base: '85vh', md: 'unset' }}
            overflow="hidden"
            p={0}
          >
            <Dialog.Header p={4} borderBottomWidth="1px" borderColor="border-primary">
              <Flex justify="space-between" align="center">
                <Dialog.Title textStyle="bodyL" fontWeight="semibold">
                  {t('Export Transfers')}
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm" minW="44px" minH="44px" p={1} onClick={handleClose}>
                    <LuX size={20} />
                  </Button>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>

            <Dialog.Body p={4}>
              <VStack gap={4} align="stretch">
                {/* Date Range Inputs */}
                {(exportState === 'idle' || exportState === 'error') && (
                  <>
                    <Box>
                      <Text textStyle="bodyS" color="text-secondary" mb={1}>
                        {t('Start Date')}
                      </Text>
                      <Input
                        type="date"
                        value={startDate}
                        max={today}
                        onChange={e => setStartDate(e.target.value)}
                        bg="bg-secondary"
                        borderColor="border-primary"
                      />
                    </Box>
                    <Box>
                      <Text textStyle="bodyS" color="text-secondary" mb={1}>
                        {t('End Date')}
                      </Text>
                      <Input
                        type="date"
                        value={endDate}
                        min={startDate}
                        max={today}
                        onChange={e => setEndDate(e.target.value)}
                        bg="bg-secondary"
                        borderColor="border-primary"
                      />
                    </Box>
                  </>
                )}

                {/* Progress Display */}
                {(exportState === 'fetching' || exportState === 'generating') && (
                  <VStack gap={3} align="stretch">
                    <Text textStyle="bodyM" color="text-primary">
                      {exportState === 'fetching' ? t('Fetching transfers...') : t('Generating CSV...')}
                    </Text>
                    {progress && (
                      <>
                        <Progress.Root size="sm" value={progress.percentComplete} colorPalette="green">
                          <Progress.Track bgColor="bg-card-surface-2" shadow="none">
                            <Progress.Range bgColor="accent-secondary" />
                          </Progress.Track>
                        </Progress.Root>
                        <Text textStyle="bodyS" color="text-secondary">
                          {t('{{count}} records fetched', { count: progress.fetchedCount })}
                        </Text>
                      </>
                    )}
                  </VStack>
                )}

                {/* Complete State */}
                {exportState === 'complete' && (
                  <VStack gap={3} align="stretch">
                    <Text textStyle="bodyM" color="text-primary">
                      {transfers.length === 0
                        ? t('No transfers found for selected date range')
                        : t('Export complete! {{count}} transfers exported.', { count: transfers.length })}
                    </Text>
                    {transfers.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleDownloadAgain}>
                        <LuDownload size={16} />
                        {t('Download Again')}
                      </Button>
                    )}
                  </VStack>
                )}

                {/* Error State */}
                {exportState === 'error' && errorMessage && (
                  <Box p={3} bg="red.900/20" borderRadius="md" borderWidth="1px" borderColor="red.500/30">
                    <Text textStyle="bodyS" color="red.300">
                      {errorMessage}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Dialog.Body>

            {/* Footer with Actions */}
            <Box p={4} borderTopWidth="1px" borderColor="border-primary">
              <Flex gap={3} justify="flex-end">
                {exportState === 'idle' && (
                  <>
                    <Button variant="ghost" onClick={handleClose}>
                      {t('Cancel')}
                    </Button>
                    <Button colorPalette="green" onClick={handleStartExport} disabled={!isValidDateRange}>
                      <LuDownload size={16} />
                      {t('Export CSV')}
                    </Button>
                  </>
                )}

                {(exportState === 'fetching' || exportState === 'generating') && (
                  <Button variant="outline" onClick={handleCancel}>
                    {t('Cancel')}
                  </Button>
                )}

                {exportState === 'complete' && (
                  <Button variant="ghost" onClick={handleClose}>
                    {t('Close')}
                  </Button>
                )}

                {exportState === 'error' && (
                  <>
                    <Button variant="ghost" onClick={handleClose}>
                      {t('Close')}
                    </Button>
                    <Button colorPalette="green" onClick={handleRetry}>
                      {t('Try Again')}
                    </Button>
                  </>
                )}
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}
