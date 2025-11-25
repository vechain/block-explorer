import { Flex, Text } from '@chakra-ui/react'
import type { HexString } from '@/lib/schemas'
import { formatAmount } from '@/lib/utils/units'
import { Tooltip } from './Tooltip'

export const VETBalance = ({ balance }: { balance: bigint | HexString }) => {
  return <Balance balance={balance} symbol="VET" decimals={18} />
}

export const VTHOBalance = ({ balance }: { balance: bigint | HexString }) => {
  return <Balance balance={balance} symbol="VTHO" decimals={18} />
}

const Balance = ({ balance, symbol, decimals }: { balance: bigint | HexString; symbol: string; decimals?: number }) => {
  const [truncatedAmount, fullAmount] = formatAmount({ amount: balance, decimals })
  return (
    <Flex textStyle="bodyL" alignItems="center" gap="1">
      <Tooltip content={fullAmount}>
        <Text>{truncatedAmount}</Text>
      </Tooltip>
      <Text>{symbol}</Text>
    </Flex>
  )
}
