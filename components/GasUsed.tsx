import { AbsoluteCenter, Flex, ProgressCircle, Text } from '@chakra-ui/react'

export const GasUsed = ({ gasUsed, gasLimit }: { gasUsed: number; gasLimit: number }) => {
  const gasUsedRatio = (gasUsed / gasLimit) * 100

  return (
    <Flex alignItems="center" gap={2}>
      <RatioCircle ratio={gasUsedRatio} />
      <Text>{[gasUsed.toLocaleString(), gasLimit.toLocaleString()].join(' / ')}</Text>
    </Flex>
  )
}

const RatioCircle = ({ ratio }: { ratio: number }) => {
  return (
    <ProgressCircle.Root size="sm" value={ratio} colorPalette="teal">
      <ProgressCircle.Circle css={{ '--thickness': '3px' }}>
        <ProgressCircle.Track />
        <ProgressCircle.Range strokeLinecap="round" />
      </ProgressCircle.Circle>
      <AbsoluteCenter>
        <ProgressCircle.ValueText fontSize="xxs" />
      </AbsoluteCenter>
    </ProgressCircle.Root>
  )
}
