import { Flex, Text } from '@chakra-ui/react'
import { VTHOBalance } from '@/components/ui-legacy/TokenBalance'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { AddressString } from '@/lib/schemas'

export const PaidGasFees = ({ paid, delegator }: { paid: bigint; delegator: AddressString | null }) => {
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
