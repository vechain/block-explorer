import { Link as ChakraLink, type LinkProps as ChakraLinkProps, Flex } from '@chakra-ui/react'
import Link, { type LinkProps as NextLinkProps } from 'next/link'
import type { AddressString } from '@/lib/schemas'
import { truncateAddress } from '@/lib/utils/address'
import { CopyToClipBoard } from './CopyToClipBoard'

export interface BaseLinkProps extends Omit<ChakraLinkProps, 'href'> {
  href: NextLinkProps['href']
}

export const BaseLink = ({ children, href, ...props }: BaseLinkProps) => {
  return (
    <ChakraLink
      asChild
      color="text-alt"
      textDecoration="underline"
      textUnderlineOffset="1px"
      maxWidth="full"
      _focus={{ outline: 'none' }}
      {...props}>
      <Link href={href}>{children}</Link>
    </ChakraLink>
  )
}

interface AddressLinkProps extends Omit<BaseLinkProps, 'href'> {
  address: AddressString
  truncate?: boolean
}

export const AddressLink = ({ address, truncate = false, ...props }: AddressLinkProps) => {
  return (
    <BaseLink href={`/address/${address}`} {...props}>
      {truncate ? truncateAddress(address) : address}
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
  return (
    <CopyableLink href={`/address/${address}`} value={address} {...props}>
      {truncate ? truncateAddress(address) : address}
    </CopyableLink>
  )
}
