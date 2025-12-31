'use client'

import { Flex, type FlexProps, Text } from '@chakra-ui/react'
import type { HexString } from '@/lib/schemas'
import { useFormatAmount } from '@/hooks/useFormatting'
import { Tooltip } from './Tooltip'

export const VETBalance = ({ balance, ...props }: { balance: bigint | HexString } & FlexProps) => {
  return <Balance balance={balance} symbol="VET" decimals={18} {...props} />
}

export const VTHOBalance = ({ balance, ...props }: { balance: bigint | HexString } & FlexProps) => {
  return <Balance balance={balance} symbol="VTHO" decimals={18} {...props} />
}

const Balance = ({
  balance,
  symbol,
  decimals,
  ...props
}: { balance: bigint | HexString; symbol: string; decimals?: number } & FlexProps) => {
  const formatAmount = useFormatAmount()
  const [truncatedAmount, fullAmount] = formatAmount({ amount: balance, decimals })
  return (
    <Flex textStyle="bodyL" alignItems="center" gap="1" justifyContent="center" {...props}>
      <Tooltip content={fullAmount} disabled={fullAmount === '0'}>
        <Text>{truncatedAmount}</Text>
      </Tooltip>
      <Text>{symbol}</Text>
    </Flex>
  )
}
