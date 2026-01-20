'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heading, Text, useBreakpointValue } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { type Column, DataTable, TableRow, TableSkeleton } from '@/components/ui/Table'
import { CopyableAddressLink, CopyableTransactionIdLink } from '@/components/ui/Links'
import { NoContracts } from '@/components/NoResults'
import type { AddressString } from '@/lib/schemas'
import { useDeployedContracts } from '@/services/veworld-indexer/hooks'
import { useFormatDate } from '@/hooks/useFormatting'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

interface DeployedContractRow extends TableRow {
  id: string
  rank: number
  address: AddressString
  createdOn: number
  deploymentTxId: `0x${string}`
}

export const DeployedContractsSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: contracts, isLoading } = useDeployedContracts({
    address,
  })

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const columns: Column<DeployedContractRow>[] = [
    {
      key: 'rank',
      label: '#',
      Cell: ({ row }) => <Text>{row.rank}</Text>,
    },
    {
      key: 'name',
      label: t('Created On'),
      Cell: ({ row }) => <Text>{formatDate(row.createdOn)}</Text>,
    },
    {
      key: 'deploymentTxId',
      label: t('Deployment Tx ID'),
      Cell: ({ row }) => <CopyableTransactionIdLink txId={row.deploymentTxId} />,
    },
    {
      key: 'address',
      label: t('Contract Address'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.address} />,
    },
  ]

  const rows: DeployedContractRow[] = (contracts?.data ?? []).map((contract, index) => {
    return {
      id: contract.address,
      rank: page * pageSize + index + 1,
      address: contract.address,
      createdOn: contract.createdOn,
      deploymentTxId: contract.deploymentTxId,
    }
  })

  const isPending = isLoading
  const hasContracts = contracts && contracts.data.length > 0

  const containerProps = useBreakpointValue({ base: { m: -4, p: 4 }, md: { m: -5, p: 5 } })

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Deployed Contracts')}
      </Heading>

      {isPending ? (
        <TableSkeleton />
      ) : !hasContracts ? (
        <NoContracts />
      ) : (
        <DataTable columns={columns} rows={rows} containerProps={containerProps} />
      )}

      {hasContracts && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          hasNext={contracts.pagination.hasNext}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </Card>
  )
}
