'use client'

import { Badge, Heading, Text, useBreakpointValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { CopyableAddressLink } from '@/components/ui/Links'
import { type Column, DataTable, type TableRow, TableSkeleton } from '@/components/ui/Table'
import { useFormatNumber } from '@/hooks/useFormatting'
import type { AddressString } from '@/lib/schemas'
import { useValidators, ValidatorStatus } from '@/services/veworld-indexer/validators'

interface EndorsedValidatorRow extends TableRow {
  id: AddressString
  validator: AddressString
  status: ValidatorStatus
  validatorStake: number
  delegated: number
  totalStaked: number
}

type StatusBadgeConfig = {
  bg: string
  color: string
  labelKey: 'Active' | 'In Queue' | 'Exiting' | 'Exited' | 'Inactive'
}

const getStatusBadgeProps = (status: ValidatorStatus): StatusBadgeConfig => {
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

export const EndorsedValidatorsSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const { data: validators, isPending } = useValidators({ endorser: address })

  const rows: EndorsedValidatorRow[] = (validators ?? []).map(validator => ({
    id: validator.id as AddressString,
    validator: validator.id as AddressString,
    status: validator.status,
    validatorStake: validator.validatorVetStaked ?? 0,
    delegated: validator.delegatorVetStaked ?? 0,
    totalStaked: validator.vetStaked ?? 0,
  }))

  const columns: Column<EndorsedValidatorRow>[] = [
    {
      key: 'validator',
      label: t('Validator'),
      Cell: ({ row }) => <CopyableAddressLink truncate address={row.validator} />,
    },
    {
      key: 'status',
      label: t('Status'),
      Cell: ({ row }) => {
        const statusBadge = getStatusBadgeProps(row.status)
        return (
          <Badge bg={statusBadge.bg} color={statusBadge.color} px={2} py={0.5} borderRadius="md" fontSize="xs">
            {t(statusBadge.labelKey)}
          </Badge>
        )
      },
    },
    {
      key: 'validatorStake',
      label: t('Validator stake'),
      Cell: ({ row }) => <Text>{formatNumber(row.validatorStake)} VET</Text>,
    },
    {
      key: 'delegated',
      label: t('Delegated'),
      Cell: ({ row }) => <Text>{formatNumber(row.delegated)} VET</Text>,
    },
    {
      key: 'totalStaked',
      label: t('Total staked'),
      Cell: ({ row }) => <Text>{formatNumber(row.totalStaked)} VET</Text>,
    },
  ]

  const containerProps = useBreakpointValue({ base: { m: -4, p: 4 }, md: { m: -5, p: 5 } })

  if (isPending) {
    return (
      <Card>
        <Heading as="h3" textStyle="displayXs">
          {t('Endorsed validators')}
        </Heading>
        <TableSkeleton />
      </Card>
    )
  }

  if (rows.length === 0) {
    return null
  }

  return (
    <Card>
      <Heading as="h3" textStyle="displayXs">
        {t('Endorsed validators')}
      </Heading>
      <DataTable columns={columns} rows={rows} containerProps={containerProps} gridProps={{ w: 'full' }} />
    </Card>
  )
}
