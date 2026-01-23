'use client'

import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  Skeleton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp, LuSearch } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { Picasso } from '@/components/ui/Picasso'
import { ValidatorStatus } from '@/services/veworld-indexer/validator-details'
import type { ValidatorForList } from '@/services/veworld-indexer/hooks'
import { useLocale } from '@/hooks/useLocale'
import { truncateHex } from '@/lib/utils/truncateHex'

enum ValidatorSortKey {
  STAKE = 'stake',
  APY = 'apy',
  RELIABILITY = 'reliability',
}

type SortDirection = 'asc' | 'desc'

interface ValidatorsTableProps {
  validators: ValidatorForList[]
  isPending: boolean
}

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

type StatusLabelKey = 'Active' | 'In Queue' | 'Exiting' | 'Exited' | 'Inactive'

const getStatusBadgeProps = (status: ValidatorStatus): { bg: string; color: string; labelKey: StatusLabelKey } => {
  switch (status) {
    case ValidatorStatus.ACTIVE:
      return { bg: 'green.600', color: 'white', labelKey: 'Active' }
    case ValidatorStatus.QUEUED:
      return { bg: 'blue.600', color: 'white', labelKey: 'In Queue' }
    case ValidatorStatus.EXITING:
      return { bg: 'red.800', color: 'white', labelKey: 'Exiting' }
    case ValidatorStatus.EXITED:
      return { bg: 'gray.600', color: 'white', labelKey: 'Exited' }
    default:
      return { bg: 'gray.600', color: 'white', labelKey: 'Inactive' }
  }
}

const abbreviateAmount = (amount: number, decimals = 1): string => {
  if (isNaN(amount) || amount === 0) return '0'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount)
}

const border = '1px solid var(--chakra-colors-border-primary)'

const getCellBorderRadius = (rowIndex: number, colIndex: number, totalRows: number, totalCols: number) => {
  const isFirstRow = rowIndex === 0
  const isLastRow = rowIndex === totalRows - 1
  const isFirstCol = colIndex === 0
  const isLastCol = colIndex === totalCols - 1

  if (isFirstRow && isFirstCol) return { borderTopLeftRadius: 'lg' }
  if (isFirstRow && isLastCol) return { borderTopRightRadius: 'lg' }
  if (isLastRow && isFirstCol) return { borderBottomLeftRadius: 'lg' }
  if (isLastRow && isLastCol) return { borderBottomRightRadius: 'lg' }
  return {}
}

const getCellBorders = (rowIndex: number, colIndex: number, totalCols: number) => {
  const isFirstRow = rowIndex === 0
  const isFirstCol = colIndex === 0
  const isLastCol = colIndex === totalCols - 1

  return {
    borderTop: isFirstRow ? border : undefined,
    borderLeft: isFirstCol ? border : undefined,
    borderRight: isLastCol ? border : undefined,
    borderBottom: border,
  }
}

export const ValidatorsTable = ({ validators, isPending }: ValidatorsTableProps) => {
  const { t } = useTranslation()
  const locale = useLocale()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ValidatorStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<ValidatorSortKey>(ValidatorSortKey.STAKE)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const handleSort = useCallback(
    (key: ValidatorSortKey) => {
      if (sortKey === key) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortDirection('desc')
      }
      setPage(0)
    },
    [sortKey],
  )

  const filteredValidators = useMemo(() => {
    // Always exclude exited validators
    let result = validators.filter(v => v.status !== ValidatorStatus.EXITED)

    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        v => v.address.toLowerCase().includes(query) || v.metadata?.name?.toLowerCase().includes(query),
      )
    }

    result.sort((a, b) => {
      let compareValue = 0

      switch (sortKey) {
        case ValidatorSortKey.STAKE:
          compareValue = a.vetStaked - b.vetStaked
          break
        case ValidatorSortKey.APY:
          compareValue = a.delegatorApy - b.delegatorApy
          break
        case ValidatorSortKey.RELIABILITY:
          compareValue = a.reliability - b.reliability
          break
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })

    return result
  }, [validators, statusFilter, searchQuery, sortKey, sortDirection])

  const paginatedValidators = useMemo(() => {
    const start = page * pageSize
    return filteredValidators.slice(start, start + pageSize)
  }, [filteredValidators, page, pageSize])

  const totalPages = Math.ceil(filteredValidators.length / pageSize)
  const hasNext = page < totalPages - 1

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const SortIcon = ({ columnKey }: { columnKey: ValidatorSortKey }) => {
    if (sortKey !== columnKey) return null
    return sortDirection === 'asc' ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />
  }

  const columns = [
    { key: 'validator', label: t('Validator'), sortable: false },
    { key: 'stake', label: t('VET Staked'), sortKey: ValidatorSortKey.STAKE },
    { key: 'apy', label: t('Avg. Delegator APY'), sortKey: ValidatorSortKey.APY },
    { key: 'reliability', label: t('Reliability'), sortKey: ValidatorSortKey.RELIABILITY },
    { key: 'status', label: t('Status'), sortable: false },
  ]

  if (isPending) {
    return (
      <Card>
        <Skeleton height="400px" width="100%" />
      </Card>
    )
  }

  return (
    <Card gap={4}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        justifyContent="space-between"
        alignItems={{ base: 'stretch', md: 'center' }}
      >
        <HStack gap={4} flexWrap="wrap">
          <Flex
            position="relative"
            width={{ base: 'full', md: '300px' }}
            border="1px solid"
            borderColor="border-primary"
            borderRadius="md"
            bg="bg-primary"
            alignItems="center"
            px={3}
          >
            <LuSearch size={16} color="var(--chakra-colors-text-secondary)" />
            <Input
              placeholder={t('Search validator...')}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              size="sm"
              border="none"
              focusVisibleRing="none"
              bg="transparent"
            />
          </Flex>
          <NativeSelect.Root size="sm" width={{ base: 'full', md: '150px' }}>
            <NativeSelect.Field
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as ValidatorStatus | 'all')
                setPage(0)
              }}
              border="1px solid"
              borderColor="border-primary"
              borderRadius="md"
              bg="bg-primary"
            >
              <option value="all">{t('All Statuses')}</option>
              <option value={ValidatorStatus.ACTIVE}>{t('Active')}</option>
              <option value={ValidatorStatus.QUEUED}>{t('In Queue')}</option>
              <option value={ValidatorStatus.EXITING}>{t('Exiting')}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </HStack>
        <Text textStyle="bodyS" color="text-secondary">
          {t('{{count}} validators', { count: filteredValidators.length })}
        </Text>
      </Flex>

      {/* Desktop Table */}
      <Box overflowX="auto" hideBelow="md">
        <Grid
          templateColumns="2fr 1fr 1fr 1fr 100px"
          textStyle="bodyM"
          role="table"
          aria-rowcount={paginatedValidators.length + 1}
        >
          {/* Header Row */}
          <Grid gridColumn="1 / -1" templateColumns="subgrid" role="row" aria-rowindex={1}>
            {columns.map(col => (
              <Box
                key={col.key}
                whiteSpace="nowrap"
                textAlign={col.key === 'validator' ? 'left' : 'center'}
                color="text-secondary"
                p={4}
                role="columnheader"
                cursor={col.sortKey ? 'pointer' : 'default'}
                onClick={() => col.sortKey && handleSort(col.sortKey)}
                _hover={col.sortKey ? { color: 'text-primary' } : undefined}
              >
                <HStack gap={1} justify={col.key === 'validator' ? 'flex-start' : 'center'}>
                  <Text>{col.label}</Text>
                  {col.sortKey && <SortIcon columnKey={col.sortKey} />}
                </HStack>
              </Box>
            ))}
          </Grid>

          {/* Data Rows */}
          {paginatedValidators.map((validator, rowIndex) => {
            const statusBadge = getStatusBadgeProps(validator.status)
            const isActive = validator.status === ValidatorStatus.ACTIVE
            const isQueued = validator.status === ValidatorStatus.QUEUED
            const totalRows = paginatedValidators.length
            const totalCols = columns.length

            return (
              <Grid
                key={validator.address}
                gridColumn="1 / -1"
                templateColumns="subgrid"
                bg={rowIndex % 2 === 0 ? 'row-odd-bg-primary' : 'row-even-bg-primary'}
                role="row"
                aria-rowindex={rowIndex + 2}
                _hover={{ bg: 'bg-alt-primary' }}
                transition="background 0.15s"
              >
                {/* Validator Name */}
                <Box
                  p={4}
                  role="cell"
                  {...getCellBorders(rowIndex, 0, totalCols)}
                  {...getCellBorderRadius(rowIndex, 0, totalRows, totalCols)}
                >
                  <Link href={`/${locale}/address/${validator.address}`}>
                    <HStack gap={3} cursor="pointer">
                      {validator.metadata?.logo ? (
                        <Image
                          src={validator.metadata.logo}
                          alt={validator.metadata?.name ?? 'Validator'}
                          width={32}
                          height={32}
                          style={{ borderRadius: '50%' }}
                        />
                      ) : (
                        <Picasso address={validator.address} size={32} />
                      )}
                      <VStack align="start" gap={0}>
                        <Text color="text-primary" textStyle="bodyM" fontWeight="medium">
                          {validator.metadata?.name ?? truncateHex(validator.address)}
                        </Text>
                        {validator.metadata?.name && (
                          <Text color="text-secondary" textStyle="bodyS">
                            {truncateHex(validator.address)}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Link>
                </Box>

                {/* VET Staked */}
                <Box
                  p={4}
                  role="cell"
                  textAlign="center"
                  {...getCellBorders(rowIndex, 1, totalCols)}
                  {...getCellBorderRadius(rowIndex, 1, totalRows, totalCols)}
                >
                  <Text color="text-primary">{isActive || isQueued ? abbreviateAmount(validator.vetStaked) : '-'}</Text>
                </Box>

                {/* APY */}
                <Box
                  p={4}
                  role="cell"
                  textAlign="center"
                  {...getCellBorders(rowIndex, 2, totalCols)}
                  {...getCellBorderRadius(rowIndex, 2, totalRows, totalCols)}
                >
                  <VStack gap={0}>
                    <Text color="text-primary">{isActive ? `${abbreviateAmount(validator.delegatorApy)}%` : '-'}</Text>
                    {isActive && validator.nextCycleDelegatorApy !== validator.delegatorApy && (
                      <Text
                        textStyle="bodyS"
                        color={validator.nextCycleDelegatorApy > validator.delegatorApy ? 'green.400' : 'red.400'}
                      >
                        {abbreviateAmount(validator.nextCycleDelegatorApy)}% {t('next cycle')}
                      </Text>
                    )}
                  </VStack>
                </Box>

                {/* Reliability */}
                <Box
                  p={4}
                  role="cell"
                  textAlign="center"
                  {...getCellBorders(rowIndex, 3, totalCols)}
                  {...getCellBorderRadius(rowIndex, 3, totalRows, totalCols)}
                >
                  <Text color="text-primary">{isActive ? `${validator.reliability.toFixed(0)}%` : '-'}</Text>
                </Box>

                {/* Status */}
                <Box
                  p={4}
                  role="cell"
                  textAlign="center"
                  {...getCellBorders(rowIndex, 4, totalCols)}
                  {...getCellBorderRadius(rowIndex, 4, totalRows, totalCols)}
                >
                  <Badge bg={statusBadge.bg} color={statusBadge.color} px={2} py={0.5} borderRadius="md" fontSize="xs">
                    {t(statusBadge.labelKey)}
                  </Badge>
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      {/* Mobile Cards */}
      <Stack gap={4} hideFrom="md">
        {paginatedValidators.map((validator, index) => {
          const statusBadge = getStatusBadgeProps(validator.status)
          const isActive = validator.status === ValidatorStatus.ACTIVE
          const isQueued = validator.status === ValidatorStatus.QUEUED

          return (
            <Link key={validator.address} href={`/${locale}/address/${validator.address}`}>
              <Box
                bg={index % 2 === 0 ? 'row-odd-bg-primary' : 'row-even-bg-primary'}
                border="1px solid"
                borderColor="border-primary"
                borderRadius="2xl"
                p={4}
                role="article"
              >
                <Stack gap={3}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <HStack gap={3}>
                      {validator.metadata?.logo ? (
                        <Image
                          src={validator.metadata.logo}
                          alt={validator.metadata?.name ?? 'Validator'}
                          width={40}
                          height={40}
                          style={{ borderRadius: '50%' }}
                        />
                      ) : (
                        <Picasso address={validator.address} size={40} />
                      )}
                      <VStack align="start" gap={0}>
                        <Text color="text-primary" textStyle="bodyM" fontWeight="medium">
                          {validator.metadata?.name ?? truncateHex(validator.address)}
                        </Text>
                        <Text color="text-secondary" textStyle="bodyS">
                          {truncateHex(validator.address)}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge
                      bg={statusBadge.bg}
                      color={statusBadge.color}
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      fontSize="xs"
                    >
                      {t(statusBadge.labelKey)}
                    </Badge>
                  </Flex>

                  <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                    <VStack align="start" gap={0} bg="bg-alt-primary" p={2} borderRadius="md">
                      <Text textStyle="bodyS" color="text-secondary">
                        {t('VET Staked')}
                      </Text>
                      <Text textStyle="bodyM" color="text-primary">
                        {isActive || isQueued ? abbreviateAmount(validator.vetStaked) : '-'}
                      </Text>
                    </VStack>
                    <VStack align="start" gap={0} bg="bg-alt-primary" p={2} borderRadius="md">
                      <Text textStyle="bodyS" color="text-secondary">
                        {t('Avg. Delegator APY')}
                      </Text>
                      <Text textStyle="bodyM" color="text-primary">
                        {isActive ? `${abbreviateAmount(validator.delegatorApy)}%` : '-'}
                      </Text>
                    </VStack>
                    <VStack align="start" gap={0} bg="bg-alt-primary" p={2} borderRadius="md">
                      <Text textStyle="bodyS" color="text-secondary">
                        {t('Reliability')}
                      </Text>
                      <Text textStyle="bodyM" color="text-primary">
                        {isActive ? `${validator.reliability.toFixed(0)}%` : '-'}
                      </Text>
                    </VStack>
                  </Grid>
                </Stack>
              </Box>
            </Link>
          )
        })}
      </Stack>

      {/* Pagination */}
      {filteredValidators.length > 0 && (
        <Flex justifyContent="flex-end" alignItems="center" gap={4} pt={4} flexWrap="wrap">
          <Text textStyle="bodyS" color="text-secondary">
            {t('Rows per page')}
          </Text>
          <NativeSelect.Root size="sm" width="70px">
            <NativeSelect.Field value={pageSize} onChange={e => handlePageSizeChange(Number(e.target.value))}>
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Text textStyle="bodyS" color="text-secondary">
            {t('Page')} {page + 1} {t('of')} {Math.max(totalPages, 1)}
          </Text>
          <Flex gap={1}>
            <IconButton
              aria-label={t('Previous page')}
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <LuChevronLeft />
            </IconButton>
            <IconButton
              aria-label={t('Next page')}
              variant="ghost"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage(page + 1)}
            >
              <LuChevronRight />
            </IconButton>
          </Flex>
        </Flex>
      )}

      {/* Empty State */}
      {filteredValidators.length === 0 && !isPending && (
        <Flex justify="center" py={8}>
          <Text color="text-secondary">{t('No validators found')}</Text>
        </Flex>
      )}
    </Card>
  )
}
