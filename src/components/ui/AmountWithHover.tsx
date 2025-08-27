import { Text } from "@chakra-ui/react"
import { Tooltip } from "@/components/ui/Tooltip"
import { formatAmount } from "@/utils/units"
import { HexString } from "@/schemas"

export const AmountWithHover = ({ amount, decimals }: { amount: bigint | HexString; decimals?: number }) => {
  const [truncatedAmount, fullAmount] = formatAmount({ amount, decimals })

  return (
    <Tooltip showArrow positioning={{ placement: "top" }} content={fullAmount}>
      <Text>{truncatedAmount}</Text>
    </Tooltip>
  )
}
