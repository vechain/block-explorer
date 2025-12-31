'use client'

import { Text } from '@chakra-ui/react'
import { Tooltip } from '@/components/ui/Tooltip'
import type { HexString } from '@/lib/schemas'
import { useFormatAmount } from '@/hooks/useFormatting'

export const AmountWithHover = ({ amount, decimals }: { amount: bigint | HexString; decimals?: number }) => {
  const formatAmount = useFormatAmount()
  const [truncatedAmount, fullAmount] = formatAmount({ amount, decimals })

  return (
    <Tooltip showArrow positioning={{ placement: 'top' }} openDelay={0} closeDelay={0} content={fullAmount}>
      <Text>{truncatedAmount}</Text>
    </Tooltip>
  )
}
