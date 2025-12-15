'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex, Text } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { CopyToClipBoard } from './CopyToClipBoard'

interface IDChipProps extends FlexProps {
  value: string
}
export const IDChip = forwardRef<HTMLDivElement, IDChipProps>(({ value, ...props }, ref) => {
  return (
    <Flex
      ref={ref}
      p="2"
      gap="2"
      alignItems="center"
      bg="bg-surface-alt"
      color="text-alt"
      borderRadius="full"
      borderWidth="1px"
      borderColor="border-surface"
      textStyle="bodyS"
      maxW="full"
      {...props}
    >
      <Text color="text-alt" maxWidth="full" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
        {value}
      </Text>
      <CopyToClipBoard value={value} />
    </Flex>
  )
})

IDChip.displayName = 'IDChip'
