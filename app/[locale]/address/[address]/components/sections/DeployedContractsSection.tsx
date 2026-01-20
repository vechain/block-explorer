'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heading, Text, useBreakpointValue } from '@chakra-ui/react'
import { Card } from '@/components/ui/Card'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { type Column, DataTable, TableRow, TableSkeleton } from '@/components/ui/Table'
import { CopyableAddressLink } from '@/components/ui/Links'
import { VETBalance } from '@/components/ui/Balance'
import { NoContracts } from '@/components/NoResults'
import type { AddressString } from '@/lib/schemas'
import { useDeployedContracts } from '@/services/veworld-indexer/hooks'
import { useMultipleAccounts } from '@/services/thor/hooks'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

interface DeployedContractRow extends TableRow {
  id: string
  rank: number
  address: AddressString
  balance: bigint
}

export const DeployedContractsSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const { data: contracts, isLoading } = useDeployedContracts({
    params: { master: address, page, size: pageSize },
  })

  const contractAddresses = contracts?.data.map(c => c.address) ?? []

  const { data: accountsMap, isPending: isLoadingBalances } = useMultipleAccounts(contractAddresses)

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
      key: 'address',
      label: t('Contract Address'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.address} />,
    },
    {
      key: 'balance',
      label: t('Balance'),
      Cell: ({ row }) => <VETBalance balance={row.balance} />,
    },
  ]

  const rows: DeployedContractRow[] = (contracts?.data ?? []).map((contract, index) => {
    const account = accountsMap?.get(contract.address)
    return {
      id: contract.address,
      rank: page * pageSize + index + 1,
      address: contract.address,
      balance: account?.vet ?? 0n,
    }
  })

  const isPending = isLoading || isLoadingBalances
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
        <DataTable columns={columns} rows={rows} containerProps={containerProps} gridProps={{ w: 'fit-content' }} />
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
