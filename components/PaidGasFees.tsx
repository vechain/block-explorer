import { Flex, Text } from '@chakra-ui/react'
import { VTHOBalance } from '@/components/ui/TokenBalance'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import type { AddressString } from '@/lib/schemas'
import { hexStringSchema } from '@/lib/schemas'

export const PaidGasFees = ({ paid, delegator }: { paid: string; delegator: AddressString | null }) => {
  const paidHex = hexStringSchema.parse(paid)

  return (
    <Flex alignItems="center" gap={2}>
      <VTHOBalance balance={paidHex} />
      {delegator && (
        <>
          <Text>by</Text>
          <VnsBadgeOrAddressLink address={delegator} truncateAddress />
        </>
      )}
    </Flex>
  )
}
