import { Badge, Spinner } from "@chakra-ui/react"

import { useVnsName } from "@/services/thor/vns/hooks"

import { Address } from "@vechain/sdk-core"

const NO_VNS_NAME = "-"

export const VnsBadge = ({ address }: { address: Address }) => {
  const { data: vnsNameArray, isLoading: isVnsLoading } = useVnsName(address)

  if (isVnsLoading) return <Spinner size="xs" />
  if (!vnsNameArray) return NO_VNS_NAME

  const [vnsName] = vnsNameArray

  if (!vnsName) return NO_VNS_NAME

  return (
    <Badge size="md" colorPalette="blue">
      {vnsName}
    </Badge>
  )
}
