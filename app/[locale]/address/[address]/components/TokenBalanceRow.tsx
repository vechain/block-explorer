import { Flex, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { formatAmount } from '@/lib/utils/units'
import { getTokenIconPath } from '@/lib/utils/tokens'

interface TokenBalanceRowProps {
  token: { symbol: string; decimals: number }
  balance: bigint | null | undefined
  isFirst: boolean
  isLast: boolean
}

export const TokenBalanceRow = ({ token, balance, isFirst, isLast }: TokenBalanceRowProps) => {
  const [formatted] = formatAmount({ amount: balance ?? BigInt(0), decimals: token.decimals })
  const iconPath = getTokenIconPath(token.symbol)

  const borderProps = isFirst
    ? { borderWidth: '1px', borderTopRadius: 'md' as const }
    : isLast
      ? { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderBottomRadius: 'md' as const }
      : { borderRightWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px' }

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      pt={4}
      pr={6}
      pb={4}
      pl={6}
      borderColor="border-primary"
      {...borderProps}
    >
      <Text textStyle="bodyM" color="text-primary">
        {token.symbol}
      </Text>
      <Flex alignItems="center" gap={2}>
        <Text textStyle="bodyM" color="text-primary">
          {formatted}
        </Text>
        {iconPath && <Image src={iconPath} alt={token.symbol} width={16} height={16} />}
      </Flex>
    </Flex>
  )
}
