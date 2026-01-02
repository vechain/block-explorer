'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex, Text } from '@chakra-ui/react'
import { forwardRef } from 'react'
import { CopyToClipBoard } from './CopyToClipBoard'

interface IDChipProps extends FlexProps {
  value: string
  vnsName?: string | null
}
export const IDChip = forwardRef<HTMLDivElement, IDChipProps>(({ value, vnsName, ...props }, ref) => {
  const displayValue = vnsName || value

  return (
    <Flex
      ref={ref}
      py="2"
      px="4"
      gap="2"
      alignItems="center"
      bg="bg-primary"
      color="text-secondary"
      borderRadius="full"
      borderWidth="1px"
      borderColor="border-primary"
      maxW="full"
      {...props}
    >
      <Text
        color="accent-primary"
        textStyle="bodyMSemibold"
        maxWidth="full"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {displayValue}
      </Text>
      <CopyToClipBoard value={value} />
    </Flex>
  )
})

IDChip.displayName = 'IDChip'
