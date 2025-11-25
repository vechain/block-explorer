import { AbsoluteCenter, Flex, ProgressCircle, Text } from '@chakra-ui/react'

export const GasUsed = ({ gasUsed, gasLimit }: { gasUsed: bigint; gasLimit: bigint }) => {
  const gasUsedRatio = (Number(gasUsed) / Number(gasLimit)) * 100

  return (
    <Flex alignItems="center" gap={2}>
      <ProgressCircle.Root size="sm" value={gasUsedRatio} colorPalette="teal">
        <ProgressCircle.Circle css={{ '--thickness': '3px' }}>
          <ProgressCircle.Track />
          <ProgressCircle.Range strokeLinecap="round" />
        </ProgressCircle.Circle>
        <AbsoluteCenter>
          <ProgressCircle.ValueText fontSize="xxs" />
        </AbsoluteCenter>
      </ProgressCircle.Root>
      <Text>{[gasUsed.toLocaleString(), gasLimit.toLocaleString()].join(' / ')}</Text>
    </Flex>
  )
}
