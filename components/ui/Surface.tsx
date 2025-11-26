'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
import { forwardRef } from 'react'

export const Surface = forwardRef<HTMLDivElement, FlexProps>(({ children, ...props }, ref) => {
  return (
    <Flex
      ref={ref}
      as="section"
      flexDirection="column"
      gap={6}
      bg="bg-card-surface"
      color="text-primary"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border-surface"
      py={5}
      px={4}
      {...props}>
      {children}
    </Flex>
  )
})

Surface.displayName = 'Surface'
