import { Flex, Skeleton, type SkeletonProps, Table as TableChakra, Text, type TextProps } from '@chakra-ui/react'
import { formatDistance } from 'date-fns'
import { HiOutlineBolt } from 'react-icons/hi2'
import type { AddressString } from '@/lib/schemas'
import { CopyableAddressLink } from './Links'

type CellValue = string | number | AddressString | boolean

export type TableRow = {
  id: string
  [key: string]: CellValue
}

export type CellComponentProps<T extends TableRow = TableRow> = {
  value: CellValue
  row: T
  columnKey: string
}

/**
 * Column definition for the reusable Table component
 */
export type Column<T extends TableRow = TableRow> = {
  /** The key to access the data from the row object */
  key: string
  /** The header label for this column */
  label: string
  /**
   * Component to render the cell content.
   * Receives: { value, row, columnKey }
   */
  Cell?: React.ComponentType<CellComponentProps<T>>
}

export type DataTableProps<T extends TableRow = TableRow> = {
  columns: Column<T>[]
  rows: T[]
}

const border = '1px solid var(--chakra-colors-border-surface)'

export const DataTable = <T extends TableRow = TableRow>({ columns, rows }: DataTableProps<T>) => (
  <TableChakra.ScrollArea>
    <TableChakra.Root
      variant="line"
      size="md"
      borderCollapse="separate"
      borderSpacing={0}
      tableLayout="auto"
      textStyle="bodyM">
      <TableChakra.Header>
        <TableChakra.Row bg="transparent">
          {columns.map(column => (
            <TableChakra.ColumnHeader
              key={column.key}
              border="none"
              whiteSpace="nowrap"
              textAlign="center"
              color="text-primary">
              {column.label}
            </TableChakra.ColumnHeader>
          ))}
        </TableChakra.Row>
      </TableChakra.Header>

      <TableChakra.Body
        css={{
          '& td::first-of-type': {
            borderLeft: border,
          },
          '& td:last-child': {
            borderRight: border,
          },
          '& tr::first-of-type td': {
            borderTop: border,
          },
          '& tr::first-of-type td::first-of-type': {
            borderTopLeftRadius: 'var(--chakra-radii-lg)',
          },
          '& tr::first-of-type td:last-child': {
            borderTopRightRadius: 'var(--chakra-radii-lg)',
          },
          '& tr:last-child td::first-of-type': {
            borderBottomLeftRadius: 'var(--chakra-radii-lg)',
          },
          '& tr:last-child td:last-child': {
            borderBottomRightRadius: 'var(--chakra-radii-lg)',
          },
          '& tr:nth-of-type(odd)': {
            background: 'var(--chakra-colors-bg-card-surface)',
          },
        }}>
        {rows.map(row => (
          <TableChakra.Row key={row.id} height="fit-content" bg="bg-card-surface-2">
            {columns.map(column => (
              <TableChakra.Cell
                key={`${row.id}-${column.key}`}
                whiteSpace="nowrap"
                borderBottom={border}
                p={4}
                textAlign="center">
                <Flex justifyContent="center">
                  {column.Cell ? (
                    <column.Cell value={row[column.key]} row={row} columnKey={column.key} />
                  ) : (
                    <TableText>{row[column.key]}</TableText>
                  )}
                </Flex>
              </TableChakra.Cell>
            ))}
          </TableChakra.Row>
        ))}
      </TableChakra.Body>
    </TableChakra.Root>
  </TableChakra.ScrollArea>
)

export const TableSkeleton = (props: SkeletonProps) => {
  return <Skeleton height="320px" width="100%" bg="bg-card-surface-2" {...props} />
}

/**
 * Cell components
 */

export const AddressCell = ({ value }: CellComponentProps) => {
  return <CopyableAddressLink address={value as AddressString} />
}

export const AgeCell = ({ value }: CellComponentProps) => {
  return (
    <Text as="span" color="highlight-secondary" display="flex" alignItems="center" textTransform="capitalize" gap={1}>
      <HiOutlineBolt size={16} />
      {formatDistance(new Date(value as number), new Date(), { addSuffix: true })}
    </Text>
  )
}

export const AppendIconCell = ({ value, icon }: { icon: React.ReactNode } & CellComponentProps) => {
  return (
    <Flex display="flex" alignItems="center" gap={2}>
      <TableText>{value}</TableText>
      {icon}
    </Flex>
  )
}

const TableText = (props: TextProps) => {
  return <Text as="span" color="text-primary" {...props} />
}
