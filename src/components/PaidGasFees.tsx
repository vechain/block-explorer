import { Flex, Text } from "@chakra-ui/react"
import { VnsBadgeOrAddressLink } from "@/components/ui/VnsBadge"
import { VTHOBalance } from "@/components/ui/TokenBalance"
import { hexStringSchema } from "@/schemas"
import { hexToBigInt } from "viem"

export const PaidGasFees = ({ paid, delegator }: { paid: string; delegator?: string }) => {
  const paidHex = hexStringSchema.parse(paid)

  return (
    <Flex alignItems="center" gap={2}>
      <VTHOBalance balance={hexToBigInt(paidHex)} />
      {delegator && (
        <>
          <Text>by</Text>
          <VnsBadgeOrAddressLink address={delegator} truncateAddress />
        </>
      )}
    </Flex>
  )
}
