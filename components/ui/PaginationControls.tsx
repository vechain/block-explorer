'use client'

import { Flex, IconButton, NativeSelect, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'

export interface PaginationControlsProps {
  /** Current page (0-indexed) */
  page: number
  /** Current page size */
  pageSize: number
  /** Available page size options */
  pageSizeOptions: readonly number[]
  /** Whether there is a next page */
  hasNext: boolean
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when page size changes */
  onPageSizeChange: (pageSize: number) => void
  /** Optional flex wrap behavior */
  flexWrap?: 'wrap' | 'nowrap'
}

/**
 * Reusable pagination controls with page size selector and navigation.
 * Used across account pages (NFTs, transactions, etc.)
 */
export const PaginationControls = ({
  page,
  pageSize,
  pageSizeOptions,
  hasNext,
  onPageChange,
  onPageSizeChange,
  flexWrap = 'nowrap',
}: PaginationControlsProps) => {
  const { t } = useTranslation()

  return (
    <Flex justifyContent="flex-end" alignItems="center" gap={4} pt={4} flexWrap={flexWrap}>
      <Text textStyle="bodyS" color="text-secondary">
        {t('Rows per page')}
      </Text>
      <NativeSelect.Root size="sm" width="70px">
        <NativeSelect.Field value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}>
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <Text textStyle="bodyS" color="text-secondary">
        {t('Page')} {page + 1}
      </Text>
      <Flex gap={1}>
        <IconButton
          aria-label={t('Previous page')}
          variant="ghost"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <LuChevronLeft />
        </IconButton>
        <IconButton
          aria-label={t('Next page')}
          variant="ghost"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          <LuChevronRight />
        </IconButton>
      </Flex>
    </Flex>
  )
}
