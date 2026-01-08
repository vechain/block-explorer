'use client'

import { Box, Flex, Heading, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HiArrowRight, HiOutlineFire, HiOutlineSparkles } from 'react-icons/hi2'
import { Card } from '@/components/ui/Card'
import { AddressLink, BaseLink } from '@/components/ui/Links'
import { AgeText } from '@/components/ui/AgeText'
import { PaginationControls } from '@/components/ui/PaginationControls'
import type { AddressString } from '@/lib/schemas'
import { useNftTransfers } from '@/services/veworld-indexer/nft-transfers'
import { ZERO_ADDRESS } from '@vechain/sdk-core'
import { truncateHex } from '@/lib/utils/truncateHex'

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

interface NftTransfersSectionProps {
  contractAddress: AddressString
  tokenId: bigint
}

type TransferType = 'mint' | 'burn' | 'transfer'

const getTransferType = (from: string, to: string): TransferType => {
  const nullAddr = ZERO_ADDRESS.toLowerCase()
  if (from.toLowerCase() === nullAddr) return 'mint'
  if (to.toLowerCase() === nullAddr) return 'burn'
  return 'transfer'
}

const TransferTypeBadge = ({ type }: { type: TransferType }) => {
  const { t } = useTranslation()

  const config = {
    mint: { label: t('Mint'), icon: HiOutlineSparkles, color: 'green.400' },
    burn: { label: t('Burn'), icon: HiOutlineFire, color: 'red.400' },
    transfer: { label: t('Transfer'), icon: HiArrowRight, color: 'blue.400' },
  }

  const { label, icon: Icon, color } = config[type]

  return (
    <Flex alignItems="center" gap={1.5}>
      <Text textStyle="bodyL" color="text-primary">
        {label}
      </Text>
      <Icon size={16} color={color} />
    </Flex>
  )
}

export const NftTransfersSection = ({ contractAddress, tokenId }: NftTransfersSectionProps) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: transfersData, isPending } = useNftTransfers({
    contractAddress,
    tokenId,
    page,
    size: pageSize,
  })

  const transfers = transfersData?.data ?? []
  const pagination = transfersData?.pagination
  const hasTransfers = transfers.length > 0

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  return (
    <Card variant="secondary">
      <Heading as="h3" textStyle="displayXs">
        {t('Transfers Events')}
      </Heading>

      {isPending ? (
        <Stack gap={3}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="60px" borderRadius="lg" />
          ))}
        </Stack>
      ) : !hasTransfers ? (
        <Text textStyle="bodyM" color="text-secondary">
          {t('No transfers')}
        </Text>
      ) : (
        <Box overflow="hidden">
          <Flex px={4} py={3} gap={4} display={{ base: 'none', md: 'flex' }}>
            <Text textStyle="bodyM" color="text-primary" flex="1">
              {t('Age')}
            </Text>
            <Text textStyle="bodyM" color="text-primary" flex="1">
              {t('Tx ID')}
            </Text>
            <Text textStyle="bodyM" color="text-primary" flex="1">
              {t('Type')}
            </Text>
            <Text textStyle="bodyM" color="text-primary" flex="2">
              {t('From/To')}
            </Text>
          </Flex>

          <Box overflow="hidden" borderWidth="1px" borderColor="border-primary" borderRadius="lg">
            {transfers.map((transfer, index) => {
              const type = getTransferType(transfer.from, transfer.to)
              const isEven = index % 2 === 0

              return (
                <Flex
                  key={transfer.id}
                  px={4}
                  py={4}
                  gap={4}
                  alignItems={{ base: 'flex-start', md: 'center' }}
                  flexDirection={{ base: 'column', md: 'row' }}
                  bg={isEven ? 'bg-alt-primary' : 'transparent'}
                >
                  <Box flex="1">
                    <AgeText timestamp={transfer.blockTimestamp * 1000} />
                  </Box>
                  <Box flex="1">
                    <BaseLink href={`/transaction/${transfer.txId}`}>{truncateHex(transfer.txId)}</BaseLink>
                  </Box>

                  <Box flex="1">
                    <TransferTypeBadge type={type} />
                  </Box>

                  <Flex flex="2" gap={2} alignItems="center" flexWrap="wrap">
                    <AddressLink address={transfer.from as AddressString} truncate />
                    <HiArrowRight size={16} />
                    <AddressLink address={transfer.to as AddressString} truncate />
                  </Flex>
                </Flex>
              )
            })}
          </Box>
        </Box>
      )}

      {hasTransfers && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={pagination?.hasNext ?? false}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          flexWrap="wrap"
        />
      )}
    </Card>
  )
}
