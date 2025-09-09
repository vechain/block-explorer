import { Flex, Text } from '@chakra-ui/react'
import { VTHOBalance } from '@/components/ui/TokenBalance'
import { VnsBadgeOrAddressLink } from '@/components/ui/VnsBadge'
import type { AddressString, HexString } from '@/lib/schemas'

export const PaidGasFees = ({ paid, delegator }: { paid: HexString; delegator: AddressString | null }) => {
  return (
    <Flex alignItems="center" gap={2}>
      <VTHOBalance balance={paid} />
      {delegator && (
        <>
          <Text>by</Text>
          <VnsBadgeOrAddressLink address={delegator} truncateAddress />
        </>
      )}
    </Flex>
  )
}
