import { Text } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui-legacy/Tooltip'
import type { HexString } from '@/lib/schemas'
import { formatAmount } from '@/lib/utils/units'

export const AmountWithHover = ({ amount, decimals }: { amount: bigint | HexString; decimals?: number }) => {
  const [truncatedAmount, fullAmount] = formatAmount({ amount, decimals })

  return (
    <Tooltip showArrow positioning={{ placement: 'top' }} openDelay={0} closeDelay={0} content={fullAmount}>
      <Text>{truncatedAmount}</Text>
    </Tooltip>
  )
}
