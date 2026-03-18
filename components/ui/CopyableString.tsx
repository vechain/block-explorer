'use client'

import { Flex, Text, type FlexProps, type TextProps } from '@chakra-ui/react'
import { CopyToClipBoard } from './CopyToClipBoard'

type CopyableStringProps = {
  value: string
  containerProps?: FlexProps
  copySize?: string
} & TextProps

export const CopyableString = ({
  value,
  children,
  containerProps,
  copySize,
  title,
  ...textProps
}: CopyableStringProps) => {
  return (
    <Flex alignItems="center" gap="2" minW="0" {...containerProps}>
      <Text color="text-primary" minW="0" title={title ?? value} {...textProps}>
        {children ?? value}
      </Text>
      <CopyToClipBoard value={value} size={copySize} />
    </Flex>
  )
}
