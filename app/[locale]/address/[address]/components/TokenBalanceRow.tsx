import { Flex, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { getTokenIconPath } from '@/lib/utils/tokens'
import { useFormatAmount } from '@/hooks/useFormatting'

interface TokenBalanceRowProps {
  token: { symbol: string; decimals: number }
  balance: bigint | null | undefined
  isFirst: boolean
  isLast: boolean
}

export const TokenBalanceRow = ({ token, balance, isFirst, isLast }: TokenBalanceRowProps) => {
  const formatAmount = useFormatAmount()
  const [formatted] = formatAmount({ amount: balance ?? BigInt(0), decimals: token.decimals })
  const iconPath = getTokenIconPath(token.symbol)

  const borderProps = isFirst
    ? { borderWidth: '1px', borderTopRadius: 'md' as const }
    : {
        borderLeftWidth: '1px',
        borderRightWidth: '1px',
        borderTopWidth: '1px',
        borderBottomWidth: '1px',
        ...(isLast && { borderBottomRadius: 'md' as const }),
      }

  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      px={6}
      py={4}
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
