import {
  Box,
  BoxProps,
  Flex,
  Grid,
  GridProps,
  Skeleton,
  type SkeletonProps,
  Stack,
  Text,
  type TextProps,
} from '@chakra-ui/react'
import { memo } from 'react'
import type { AddressString } from '@/lib/schemas'

type CellValue = string | number | AddressString | boolean | bigint

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

type DataTableProps<T extends TableRow = TableRow> = {
  columns: Column<T>[]
  rows: T[]
  gridProps?: GridProps
  containerProps?: BoxProps
}

const border = '1px solid var(--chakra-colors-border-primary)'

const getTemplateColumns = (columnCount: number) => {
  if (columnCount <= 2) return `repeat(${columnCount}, auto)`
  const middleCols = columnCount - 2
  return `auto repeat(${middleCols}, 1fr) auto`
}

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

export const DataTable = <T extends TableRow = TableRow>({
  columns,
  rows,
  gridProps,
  containerProps,
}: DataTableProps<T>) => (
  <>
    {/* Desktop/Tablet: Grid Table View */}
    <Box overflowX="auto" hideBelow="md" {...containerProps}>
      <Grid
        templateColumns={getTemplateColumns(columns.length)}
        textStyle="bodyM"
        role="table"
        aria-rowcount={rows.length + 1}
        {...gridProps}
      >
        {/* Header Row */}
        <Grid gridColumn="1 / -1" templateColumns="subgrid" role="row" aria-rowindex={1}>
          {columns.map(column => (
            <Box key={column.key} whiteSpace="nowrap" textAlign="center" color="text-primary" p={4} role="columnheader">
              {column.label}
            </Box>
          ))}
        </Grid>

        {/* Data Rows */}
        {rows.map((row, rowIndex) => (
          <Grid
            key={row.id}
            gridColumn="1 / -1"
            templateColumns="subgrid"
            bg={rowIndex % 2 === 0 ? 'row-odd-bg-primary' : 'row-even-bg-primary'}
            role="row"
            aria-rowindex={rowIndex + 2}
          >
            {columns.map((column, colIndex) => (
              <Box
                key={`${row.id}-${column.key}`}
                whiteSpace="nowrap"
                p={4}
                textAlign="center"
                {...getCellBorders(rowIndex, colIndex, columns.length)}
                {...getCellBorderRadius(rowIndex, colIndex, rows.length, columns.length)}
                role="cell"
              >
                <Flex justifyContent="center" alignItems="center" h="full">
                  <MemoizedCell column={column} row={row} />
                </Flex>
              </Box>
            ))}
          </Grid>
        ))}
      </Grid>
    </Box>

    {/* Mobile: Card View */}
    <Stack gap={3} hideFrom="md">
      {rows.map((row, rowIndex) => (
        <MobileCard key={row.id} row={row} columns={columns} rowIndex={rowIndex} />
      ))}
    </Stack>
  </>
)

/**
 * Memoized cell component to prevent re-renders
 */
const MemoizedCell = memo(function MemoizedCell<T extends TableRow = TableRow>({
  column,
  row,
}: {
  column: Column<T>
  row: T
}) {
  if (column.Cell) {
    return <column.Cell value={row[column.key]} row={row} columnKey={column.key} />
  }
  return <TableText>{row[column.key]}</TableText>
}) as <T extends TableRow = TableRow>(props: { column: Column<T>; row: T }) => React.ReactNode

/**
 * Mobile card component for displaying a single row as a card
 */
const MobileCard = memo(function MobileCard<T extends TableRow = TableRow>({
  row,
  columns,
  rowIndex,
}: {
  row: T
  columns: Column<T>[]
  rowIndex: number
}) {
  return (
    <Box
      bg={rowIndex % 2 === 0 ? 'row-odd-bg-primary' : 'row-even-bg-primary'}
      border={border}
      borderRadius="lg"
      p={4}
      role="article"
    >
      <Stack gap={3}>
        {columns.map(column => (
          <Flex key={column.key} justifyContent="space-between" alignItems="center" gap={2}>
            <Text color="text-secondary" textStyle="bodyS" flexShrink={0} fontWeight="bold">
              {column.label}
            </Text>
            <Box textStyle="bodyM" textAlign="right" overflow="hidden">
              <MemoizedCell column={column} row={row} />
            </Box>
          </Flex>
        ))}
      </Stack>
    </Box>
  )
}) as <T extends TableRow = TableRow>(props: { row: T; columns: Column<T>[]; rowIndex: number }) => React.ReactNode

export const TableSkeleton = (props: SkeletonProps) => {
  return <Skeleton height="320px" width="100%" bg="bg-primary" {...props} />
}

/**
 * Cell components
 */

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
