'use client'

import { Link as ChakraLink, type LinkProps as ChakraLinkProps, Flex, Image, Skeleton, Text } from '@chakra-ui/react'
import Link, { type LinkProps as NextLinkProps } from 'next/link'
import { LuArrowRight } from 'react-icons/lu'
import type { AddressString, HexString } from '@/lib/schemas'
import { truncateAddress } from '@/lib/utils/address'
import { truncateString } from '@/lib/utils/truncateString'
import { truncateHex } from '@/lib/utils/truncateHex'
import { CopyToClipBoard } from './CopyToClipBoard'
import { useVnsName } from '@/services/thor/vns'
import { useMemo } from 'react'
import { useNetworkAwareHref } from '@/hooks/useNetworkAwareHref'

interface BaseLinkProps extends Omit<ChakraLinkProps, 'href'> {
  href: NextLinkProps['href']
}

const useNetworkAwareLinkHref = (href: NextLinkProps['href']): NextLinkProps['href'] => {
  const stringHref = typeof href === 'string' ? href : ''
  const networkAwareStringHref = useNetworkAwareHref(stringHref)
  return typeof href === 'string' ? networkAwareStringHref : href
}

const BaseLink = ({ children, href, ...props }: BaseLinkProps) => {
  const finalHref = useNetworkAwareLinkHref(href)
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
      <Link href={finalHref}>{children}</Link>
    </ChakraLink>
  )
}

export const ViewAllLink = ({ children, href, ...props }: BaseLinkProps) => {
  const finalHref = useNetworkAwareLinkHref(href)
  return (
    <ChakraLink
      asChild
      color="text-link"
      textDecoration="none"
      textStyle="bodyMSemibold"
      display="inline-flex"
      alignItems="center"
      gap={1}
      _focus={{ outline: 'none' }}
      _hover={{ textDecoration: 'underline' }}
      {...props}
    >
      <Link href={finalHref}>
        {children}
        <LuArrowRight />
      </Link>
    </ChakraLink>
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
  /** Shown in place of the VNS name or address when the caller already knows who this is. */
  label?: string
  logo?: string
}

export const CopyableAddressLink = ({ address, truncate = true, label, logo, ...props }: CopyableAddressLinkProps) => {
  const { data: vnsName, isPending } = useVnsName(address)

  const displayAddress = useMemo(() => {
    if (!address) return '-'
    if (label) return truncate ? truncateString(label, 24, 0) : label
    if (vnsName) return truncate ? truncateString(vnsName, 20, 6) : vnsName
    return truncate ? truncateAddress(address) : address
  }, [label, vnsName, truncate, address])

  if (isPending && !label) {
    return <Skeleton height="16px" width="100px" />
  }

  if (!address) {
    return <Text color="text-secondary">-</Text>
  }

  return (
    <CopyableLink href={`/address/${address}`} value={address} {...props}>
      {logo && (
        <Image src={logo} alt="" boxSize="4" borderRadius="full" display="inline-block" verticalAlign="-3px" mr={1.5} />
      )}
      {displayAddress}
    </CopyableLink>
  )
}

interface CopyableTransactionIdLinkProps extends Omit<BaseLinkProps, 'href'> {
  txId: HexString
  truncate?: boolean
}

export const CopyableTransactionIdLink = ({ txId, truncate = true, ...props }: CopyableTransactionIdLinkProps) => {
  const displayTxId = useMemo(() => {
    if (!txId) return '-'
    return truncate ? truncateHex(txId) : txId
  }, [txId, truncate])

  if (!txId) {
    return <Text color="text-secondary">-</Text>
  }

  return (
    <CopyableLink href={`/transactions/${txId}`} value={txId} {...props}>
      {displayTxId}
    </CopyableLink>
  )
}
