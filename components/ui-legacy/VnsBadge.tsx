import { Badge, Text } from '@chakra-ui/react'
import type { AddressString } from '@/lib/schemas'
import { useVnsName } from '@/services/thor/hooks'
import { Tooltip } from '../ui/Tooltip'
import { AddressLink, CopyableLink } from './Links'

export const VnsBadgeOrAddressLink = ({
  address,
  truncateAddress = false,
}: {
  address: AddressString
  truncateAddress?: boolean
}) => {
  const { data: vnsName } = useVnsName(address)

  if (!vnsName) return <AddressLink address={address} truncate={truncateAddress} />

  return <VnsBadge address={address} vnsName={vnsName} />
}

export const VnsBadge = ({
  address,
  vnsName,
  size = 'sm',
}: {
  address: AddressString
  vnsName: string | null | undefined
  size?: 'sm' | 'md'
}) => {
  if (!vnsName) return '-'

  return (
    <CopyableLink to={`/address/${address}`} value={address}>
      <Tooltip showArrow positioning={{ placement: 'top' }} openDelay={0} closeDelay={0} content={vnsName}>
        <Badge
          size={size}
          variant="outline"
          borderRadius="md"
          border="1px dashed"
          borderColor="blue.solid"
          color="blue.solid"
          boxShadow="none"
        >
          <Text as="span" maxW="150px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            {vnsName}
          </Text>
        </Badge>
      </Tooltip>
    </CopyableLink>
  )
}
