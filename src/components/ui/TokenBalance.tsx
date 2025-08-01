import { Flex, Image, Text } from "@chakra-ui/react"
import { formatEther } from "@/utils/units"
import { HexString } from "@/schemas"
import { hexToBigInt } from "viem"

export const VETBalance = ({ balance }: { balance: bigint | HexString }) => {
  return <TokenBalance balance={balance} symbol="VET" imgSrc="/tokens/VET.svg" />
}

export const VTHOBalance = ({ balance }: { balance: bigint | HexString }) => {
  return <TokenBalance balance={balance} symbol="VTHO" imgSrc="/tokens/VTHO.svg" />
}

const TokenBalance = ({ balance, symbol, imgSrc }: { balance: bigint | HexString; symbol: string; imgSrc: string }) => {
  const parsedBalance = typeof balance === "bigint" ? balance : hexToBigInt(balance)
  const readableBalance = formatEther(parsedBalance)

  return (
    <Flex alignItems="center" gap={2}>
      <Image src={imgSrc} boxSize="24px" />
      <Text>
        {readableBalance} {symbol}
      </Text>
    </Flex>
  )
}
