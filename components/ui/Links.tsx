import { Link as ChakraLink, type LinkProps as ChakraLinkProps, Flex, Skeleton, Text } from '@chakra-ui/react'
import Link, { type LinkProps as NextLinkProps } from 'next/link'
import type { AddressString } from '@/lib/schemas'
import { truncateAddress } from '@/lib/utils/address'
import { truncateString } from '@/lib/utils/truncateString'
import { CopyToClipBoard } from './CopyToClipBoard'
import { useVnsName } from '@/services/thor/hooks'
import { useMemo } from 'react'
interface BaseLinkProps extends Omit<ChakraLinkProps, 'href'> {
  href: NextLinkProps['href']
}

export const BaseLink = ({ children, href, ...props }: BaseLinkProps) => {
  return (
    <ChakraLink
      asChild
      color="text-alt-secondary"
      textDecoration="underline"
      textUnderlineOffset="1px"
      maxWidth="full"
      _focus={{ outline: 'none' }}
      {...props}
    >
      <Link href={href}>{children}</Link>
    </ChakraLink>
  )
}

interface AddressLinkProps extends Omit<BaseLinkProps, 'href'> {
  address: AddressString
  truncate?: boolean
}

export const AddressLink = ({ address, truncate = false, ...props }: AddressLinkProps) => {
  const { data: vnsName, isPending } = useVnsName(address)

  if (isPending) {
    return <Skeleton height="16px" width="100%" />
  }

  return (
    <BaseLink href={`/address/${address}`} {...props}>
      {vnsName ? vnsName : truncate ? truncateAddress(address) : address}
    </BaseLink>
  )
}

//************************* Copyable Links *************************//
interface CopyableLinkProps extends BaseLinkProps {
  value: string
}

export const CopyableLink = ({ href, value, children, ...props }: CopyableLinkProps) => {
  return (
    <Flex gap={2} alignItems="center" w="fit-content">
      <BaseLink href={href} {...props}>
        {children}
      </BaseLink>
      <CopyToClipBoard value={value} />
    </Flex>
  )
}

interface CopyableAddressLinkProps extends Omit<BaseLinkProps, 'href'> {
  address: AddressString
  truncate?: boolean
}

export const CopyableAddressLink = ({ address, truncate = true, ...props }: CopyableAddressLinkProps) => {
  const { data: vnsName, isPending } = useVnsName(address)

  const displayAddress = useMemo(() => {
    if (!address) return '-'
    if (vnsName) return truncate ? truncateString(vnsName, 20, 6) : vnsName
    return truncate ? truncateAddress(address) : address
  }, [vnsName, truncate, address])

  if (isPending) {
    return <Skeleton height="16px" width="100px" />
  }

  if (!address) {
    return <Text color="text-secondary">-</Text>
  }

  return (
    <CopyableLink href={`/address/${address}`} value={address} {...props}>
      {displayAddress}
    </CopyableLink>
  )
}
