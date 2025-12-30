import { Flex, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { getTokenIconPath } from '@/lib/utils/tokens'

interface TokenValueRowProps {
  token: { symbol: string }
  value: string
  isFirst: boolean
  isLast: boolean
}

export const TokenValueRow = ({ token, value, isFirst, isLast }: TokenValueRowProps) => {
  const iconPath = getTokenIconPath(token.symbol)

  const borderProps = isFirst
    ? { borderWidth: '1px', borderTopRadius: 'md' as const }
    : { borderX: '1px', borderBottomWidth: '1px', ...(isLast && { borderBottomRadius: 'md' as const }) }

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
          {value}
        </Text>
        {iconPath && <Image src={iconPath} alt={token.symbol} width={16} height={16} />}
      </Flex>
    </Flex>
  )
}
