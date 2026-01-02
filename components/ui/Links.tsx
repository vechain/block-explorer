import { Link as ChakraLink, type LinkProps as ChakraLinkProps, Flex, Skeleton } from '@chakra-ui/react'
import Link, { type LinkProps as NextLinkProps } from 'next/link'
import type { AddressString } from '@/lib/schemas'
import { truncateAddress } from '@/lib/utils/address'
import { stripVnsSuffix } from '@/lib/utils/vns'
import { CopyToClipBoard } from './CopyToClipBoard'
import { useVnsName } from '@/services/thor/hooks'
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
      {vnsName ? stripVnsSuffix(vnsName) : truncate ? truncateAddress(address) : address}
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

export const CopyableAddressLink = ({ address, truncate = false, ...props }: CopyableAddressLinkProps) => {
  const { data: vnsName, isPending } = useVnsName(address)

  if (isPending) {
    return <Skeleton height="16px" width="100%" />
  }

  return (
    <CopyableLink href={`/address/${address}`} value={address} {...props}>
      {vnsName ? stripVnsSuffix(vnsName) : truncate ? truncateAddress(address) : address}
    </CopyableLink>
  )
}
