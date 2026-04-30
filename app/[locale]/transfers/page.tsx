'use client'

import { Box, Button, Flex, Heading, Stack } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { TableSkeleton } from '@/components/ui/Table'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { NoTokenTransfers } from '@/components/NoResults'
import { TransfersTable } from '@/components/TransfersTable'
import { useLatestTransfers } from '@/services/veworld-indexer/latest-transfers'
import type { TransferEventType } from '@/services/veworld-indexer/schemas'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

type FilterId = 'all' | 'token' | 'nft' | 'multi'

// "token" matches the legacy /transfers/token semantics: native VET + ERC20.
const FILTER_TO_EVENT_TYPES: Record<FilterId, TransferEventType[] | undefined> = {
  all: undefined,
  token: ['VET', 'FUNGIBLE_TOKEN'],
  nft: ['NFT'],
  multi: ['SEMI_FUNGIBLE_TOKEN'],
}

const QUERY_PARAM_TO_FILTER: Record<string, FilterId> = {
  all: 'all',
  token: 'token',
  nft: 'nft',
  multi: 'multi',
}

export default function TransfersPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = QUERY_PARAM_TO_FILTER[searchParams.get('type') ?? 'all'] ?? 'all'

  const [filter, setFilter] = useState<FilterId>(initialFilter)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const filters: { id: FilterId; label: string }[] = useMemo(
    () => [
      { id: 'all', label: t('All') },
      { id: 'token', label: t('Tokens') },
      { id: 'nft', label: t('NFTs') },
      { id: 'multi', label: t('Multi-token') },
    ],
    [t],
  )

  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useLatestTransfers({
    size: pageSize,
    eventType: FILTER_TO_EVENT_TYPES[filter],
  })

  const pages = data?.pages ?? []
  const currentPageData = pages[page]?.data ?? []
  const hasNext = page < pages.length - 1 || Boolean(hasNextPage)

  // Sync filter to URL so /transfers?type=nft works for shared links and redirects
  useEffect(() => {
    const next = filter === 'all' ? '' : `?type=${filter}`
    const current = searchParams.get('type')
    if ((filter === 'all' && current) || (filter !== 'all' && current !== filter)) {
      router.replace(`/transfers${next}`, { scroll: false })
    }
  }, [filter, router, searchParams])

  const handlePageChange = async (newPage: number) => {
    if (newPage > pages.length - 1 && hasNextPage && !isFetchingNextPage) {
      await fetchNextPage()
    }
    setPage(newPage)
  }

  const handleFilterChange = (next: FilterId) => {
    setFilter(next)
    setPage(0)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(0)
  }

  const hasNoTransfers = !isPending && pages.length > 0 && pages.every(p => p.data.length === 0)

  return (
    <Stack gap={8} mt={8}>
      <Card>
        <Heading as="h2" textStyle="displayXs">
          {t('Token Transfers')}
        </Heading>
        <Flex gap={2} flexWrap="wrap" mt={4}>
          {filters.map(f => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? 'solid' : 'outline'}
              onClick={() => handleFilterChange(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </Flex>
        <Box minHeight="400px" mt={4}>
          {isPending ? (
            <TableSkeleton />
          ) : hasNoTransfers ? (
            <NoTokenTransfers />
          ) : (
            <TransfersTable transfers={currentPageData} />
          )}
        </Box>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={hasNext}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>
    </Stack>
  )
}
