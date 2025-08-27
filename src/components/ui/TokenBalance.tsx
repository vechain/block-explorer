import { Flex, Image, Text } from "@chakra-ui/react"
import { HexString } from "@/schemas"
import { AmountWithHover } from "./AmountWithHover"

export const VETBalance = ({ balance }: { balance: bigint | HexString }) => {
  return <TokenBalance balance={balance} symbol="VET" imgSrc="/tokens/VET.svg" />
}

export const VTHOBalance = ({ balance }: { balance: bigint | HexString }) => {
  return <TokenBalance balance={balance} symbol="VTHO" imgSrc="/tokens/VTHO.svg" />
}

const TokenBalance = ({
  balance,
  symbol,
  imgSrc,
  decimals,
}: {
  balance: bigint | HexString
  symbol: string
  imgSrc: string
  decimals?: number
}) => {
  return (
    <Flex alignItems="center" gap={2}>
      {imgSrc && <Image src={imgSrc} boxSize="24px" />}
      <AmountWithHover amount={balance} decimals={decimals} />
      <Text>{symbol}</Text>
    </Flex>
  )
}
