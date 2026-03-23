'use client'

import { Flex, type FlexProps, HStack, Stack, Text } from '@chakra-ui/react'
import { useMemo, type ReactNode } from 'react'
import { formatUnits, hexToBigInt } from 'viem'
import { useFormatAmount, useFormatCurrency } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import type { HexString } from '@/lib/schemas'
import { Tooltip } from './Tooltip'

export const VETBalance = ({ balance, ...props }: { balance: bigint | HexString } & FlexProps) => {
  return <Balance balance={balance} symbol="VET" decimals={18} {...props} />
}

export const VTHOBalance = ({ balance, ...props }: { balance: bigint | HexString } & FlexProps) => {
  return <Balance balance={balance} symbol="VTHO" decimals={18} {...props} />
}

export const VTHOBalanceWithFiat = ({
  balance,
  beforeAmount,
  afterAmount,
  footer,
  footerInlineOnDesktop = false,
}: {
  balance: bigint | HexString
  beforeAmount?: ReactNode
  afterAmount?: ReactNode
  footer?: ReactNode
  footerInlineOnDesktop?: boolean
}) => {
  const formatCurrency = useFormatCurrency()
  const { price: vthoPrice } = useTokenDailyPrices('vethor-token')

  const fiatValue = useMemo(() => {
    if (vthoPrice === undefined) return undefined

    const rawBalance = typeof balance === 'bigint' ? balance : hexToBigInt(balance)

    return Number(formatUnits(rawBalance, 18)) * vthoPrice
  }, [balance, vthoPrice])

  const amountContent = (
    <Stack gap={0} alignItems="flex-end">
      <HStack gap={beforeAmount || afterAmount ? 2 : 0}>
        {beforeAmount}
        <VTHOBalance balance={balance} />
        {afterAmount}
      </HStack>
      {fiatValue !== undefined && (
        <Text textStyle="bodyS" color="text-secondary">
          {formatCurrency(fiatValue, getFiatFormatOptions(fiatValue))}
        </Text>
      )}
    </Stack>
  )

  if (footer && footerInlineOnDesktop) {
    return (
      <Flex
        direction={{ base: 'column', md: 'row' }}
        alignItems={{ base: 'flex-end', md: 'center' }}
        justifyContent="flex-end"
        gap={{ base: 1, md: 3 }}
      >
        {amountContent}
        <Flex alignItems="center">{footer}</Flex>
      </Flex>
    )
  }

  return (
    <Stack gap={footer ? 1 : 0} alignItems="flex-end">
      {amountContent}
      {footer}
    </Stack>
  )
}

export const Balance = ({
  balance,
  symbol,
  decimals,
  ...props
}: { balance: bigint | HexString; symbol?: string; decimals?: number } & FlexProps) => {
  const formatAmount = useFormatAmount()
  const [truncatedAmount, fullAmount] = formatAmount({ amount: balance, decimals })
  return (
    <Flex textStyle="bodyL" alignItems="center" gap="1" justifyContent="center" {...props}>
      <Tooltip content={fullAmount} disabled={fullAmount === '0'}>
        <Text>{truncatedAmount}</Text>
      </Tooltip>
      {symbol && <Text>{symbol}</Text>}
    </Flex>
  )
}

const getFiatFormatOptions = (value: number): Intl.NumberFormatOptions => {
  if (value > 0 && value < 0.01) {
    return {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }
  }

  return {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
}
