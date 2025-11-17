import { Card, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { NoTokens } from '@/components/NoResults'
import { AmountWithHover } from '@/components/ui-legacy/AmountWithHover'
import { ErrorBoundary } from '@/components/ui-legacy/ErrorBoundary'
import type { AddressString } from '@/lib/schemas'
import { isNotNullish } from '@/lib/type-predicates'
import { type Erc20, useErc20BalanceOf, useErc20Contracts } from '@/services/thor/tokens/erc20'
import { useAccountErc20Contracts } from '@/services/veworld-indexer/hooks'

const PAGE_SIZE = 30

export const AccountTokensTab = ({ address }: { address: AddressString }) => {
  const { data: tokenAddresses, isLoading: isLoadingTokenAddresses } = useAccountErc20Contracts({
    params: { address, size: PAGE_SIZE },
  })

  const { data: erc20Map, isPending: isPendingTokenContracts } = useErc20Contracts({
    contractAddressList: new Set<AddressString>(tokenAddresses?.data ?? []),
  })

  if (isLoadingTokenAddresses || isPendingTokenContracts) return <div>Loading...</div>

  if (!tokenAddresses || tokenAddresses.data.length === 0 || erc20Map.size === 0) return <NoTokens />

  const erc20s = Array.from(erc20Map.values()).filter(isNotNullish)

  return (
    <Flex flexWrap="wrap" gap={4}>
      {erc20s.map(erc20 => (
        <ErrorBoundary key={erc20.address}>
          <Erc20Token token={erc20} accountAddress={address} />
        </ErrorBoundary>
      ))}
    </Flex>
  )
}

const Erc20Token = ({ token, accountAddress }: { token: Erc20; accountAddress: AddressString }) => {
  const { data: balance } = useErc20BalanceOf({
    contract: token.contract,
    accountAddress,
  })

  const amount = balance ?? BigInt(0)

  return (
    <Link href={`/address/${token.address}`}>
      <Card.Root width="150px" css={{ _hover: { bg: 'gray.100' } }}>
        <Card.Body alignItems="center" gap={2}>
          <Text fontWeight="bold">{token.symbol}</Text>
          <AmountWithHover amount={amount} decimals={token.decimals} />
        </Card.Body>
      </Card.Root>
    </Link>
  )
}
