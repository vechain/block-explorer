'use client'

import { Card, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { NoTokens } from '@/components/NoResults'
import { AmountWithHover } from '@/components/ui/AmountWithHover'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { AddressString } from '@/lib/schemas'
import type { Vip180 } from '@/services/thor/contract'
import { useVip180List } from '@/services/thor/hooks'
import { useAccountFungibleTokenContracts } from '@/services/veworld-indexer/hooks'

const PAGE_SIZE = 30

export const AccountTokensTab = ({ address }: { address: AddressString }) => {
  const { data: tokenAddresses, isLoading: isLoadingTokenAddresses } = useAccountFungibleTokenContracts({
    params: { address, size: PAGE_SIZE },
  })

  const { data: tokenContracts, isPending: isPendingTokenContracts } = useVip180List({
    addresses: tokenAddresses?.data ?? [],
    accountAddress: address,
  })

  if (isLoadingTokenAddresses || isPendingTokenContracts) return <div>Loading...</div>

  if (!tokenAddresses || tokenAddresses.data.length === 0 || !tokenContracts) return <NoTokens />

  const tokens = Object.values(tokenContracts).filter(t => Boolean(t) && t?.balance !== BigInt(0)) as Vip180[]

  return (
    <Flex flexWrap="wrap" gap={4}>
      {tokens.map(token => (
        <ErrorBoundary key={token.address}>
          <Token token={token} />
        </ErrorBoundary>
      ))}
    </Flex>
  )
}

const Token = ({ token }: { token: Vip180 }) => {
  return (
    <Link href={`/address/${token.address}`}>
      <Card.Root width="150px" css={{ _hover: { bg: 'gray.100' } }}>
        <Card.Body alignItems="center" gap={2}>
          <Text fontWeight="bold">{token.symbol}</Text>
          <AmountWithHover amount={token.balance} decimals={token.decimals} />
        </Card.Body>
      </Card.Root>
    </Link>
  )
}
