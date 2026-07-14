'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Heading } from '@chakra-ui/react'
import { LuDownload } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { ToggleGroup, type ToggleOption } from '@/components/ui/ToggleGroup'
import { TableSkeleton } from '@/components/ui/Table'
import { NoTokenTransfers } from '@/components/NoResults'
import { ExportTransfersModal } from '@/components/ExportTransfersModal'
import type { AddressString } from '@/lib/schemas'
import { TOKEN_CONTRACT_ADDRESSES, TokenSymbol, type TokenFilterKey } from '@/lib/constants/tokens'
import { useAccountTransfers } from '@/services/veworld-indexer/account-transfers'
import { TransfersTable } from '@/components/TransfersTable'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

type EventType = 'FUNGIBLE_TOKEN' | 'NFT' | TokenSymbol.VET
type TransfersFilterKey = TokenFilterKey | 'NFT'

export const AccountTokenTransfersSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const [selectedToken, setSelectedToken] = useState<TransfersFilterKey>('ALL')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const tokenFilterOptions: ToggleOption<TransfersFilterKey>[] = [
    { value: 'ALL', label: t('All') },
    { value: TokenSymbol.VET, label: t('VET') },
    { value: TokenSymbol.VTHO, label: t('VTHO') },
    { value: TokenSymbol.B3TR, label: t('B3TR') },
    { value: TokenSymbol.VOT3, label: t('VOT3') },
    { value: 'NFT', label: t('NFT') },
  ]

  const { tokenAddress, eventType } = useMemo((): {
    tokenAddress: AddressString | undefined
    eventType: EventType | undefined
  } => {
    switch (selectedToken) {
      case TokenSymbol.VET:
        return { tokenAddress: undefined, eventType: TokenSymbol.VET }
      case 'NFT':
        return { tokenAddress: undefined, eventType: 'NFT' }
      case TokenSymbol.VTHO:
      case TokenSymbol.B3TR:
      case TokenSymbol.VOT3:
        return {
          tokenAddress: TOKEN_CONTRACT_ADDRESSES[selectedToken] as AddressString,
          eventType: undefined,
        }
      default:
        return { tokenAddress: undefined, eventType: undefined }
    }
  }, [selectedToken])

  const { data: transfers, isLoading } = useAccountTransfers({
    params: {
      address,
      tokenAddress,
      eventType,
      page,
      size: pageSize,
    },
  })

  const handleTokenChange = (token: TransfersFilterKey) => {
    setSelectedToken(token)
    setPage(0)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const hasTransfers = (transfers?.data?.length ?? 0) > 0
  const showPagination = transfers && (hasTransfers || transfers.pagination.hasNext || page > 0)

  return (
    <Card>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        flexWrap="wrap"
        gap={4}
      >
        <Heading as="h3" textStyle="displayXs">
          {t('Token Transfers')}
        </Heading>
        <Flex gap={2} align="center" flexWrap="wrap">
          <ToggleGroup
            options={tokenFilterOptions}
            value={selectedToken}
            onChange={handleTokenChange}
            layoutId="token-transfers-filter"
            size="sm"
          />
          <Button variant="ghost" size="sm" onClick={() => setIsExportModalOpen(true)} title={t('Export CSV')}>
            <LuDownload size={16} />
          </Button>
        </Flex>
      </Flex>

      {isLoading ? (
        <TableSkeleton />
      ) : hasTransfers ? (
        <TransfersTable transfers={transfers?.data ?? []} />
      ) : (
        <NoTokenTransfers />
      )}

      {showPagination && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={transfers?.pagination.hasNext ?? false}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <ExportTransfersModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} address={address} />
    </Card>
  )
}
