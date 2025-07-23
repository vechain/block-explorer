import { Badge } from "@chakra-ui/react"

import { useVnsName } from "@/services/thor/vns/hooks"

import { Address } from "@vechain/sdk-core"

import { AddressLink, CopyableLink } from "./Links"

export const VnsBadgeOrAddressLink = ({
  address,
  truncateAddress = false,
}: {
  address: string | Address
  truncateAddress?: boolean
}) => {
  const { data: vnsName } = useVnsName(address)

  if (!vnsName) return <AddressLink address={address.toString()} truncate={truncateAddress} />

  return <VnsBadge address={address} vnsName={vnsName} />
}

export const VnsBadge = ({
  address,
  vnsName,
  size = "sm",
}: {
  address: Address | string
  vnsName: string | null | undefined
  size?: "sm" | "md"
}) => {
  if (!vnsName) return "-"

  return (
    <CopyableLink to={`/address/${address.toString()}`} value={address.toString()}>
      <Badge
        size={size}
        variant="outline"
        borderRadius="md"
        border="1px dashed"
        borderColor="blue.solid"
        color="blue.solid"
        boxShadow="none">
        {vnsName}
      </Badge>
    </CopyableLink>
  )
}
