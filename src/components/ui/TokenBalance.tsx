import { Flex, Image, Text } from "@chakra-ui/react"
import { formatEther } from "@/utils/units"

export const VETBalance = ({ balance }: { balance: bigint }) => {
  return <TokenBalance balance={balance} symbol="VET" imgSrc="/tokens/VET.svg" />
}

export const VTHOBalance = ({ balance }: { balance: bigint }) => {
  return <TokenBalance balance={balance} symbol="VTHO" imgSrc="/tokens/VTHO.svg" />
}

const TokenBalance = ({ balance, symbol, imgSrc }: { balance: bigint; symbol: string; imgSrc: string }) => {
  const readableBalance = formatEther(balance)

  return (
    <Flex alignItems="center" gap={2}>
      <Image src={imgSrc} boxSize="24px" />
      <Text>
        {readableBalance} {symbol}
      </Text>
    </Flex>
  )
}
