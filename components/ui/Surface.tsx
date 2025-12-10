'use client'

import type { BoxProps, FlexProps } from '@chakra-ui/react'
import { Box, Flex } from '@chakra-ui/react'
import { forwardRef } from 'react'

export const Surface = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
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
      {...props}
    />
  )
})

Surface.displayName = 'Surface'

export const SurfaceAlt = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  return <Surface ref={ref} bg="bg-surface-alt" border="none" p={{ base: '2', md: '4' }} gap="4" {...props} />
})

SurfaceAlt.displayName = 'SurfaceAlt'

export const BorderedSurface = forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
  return <Box ref={ref} borderWidth="1px" borderColor="border-surface" p="4" rounded="md" {...props} />
})

BorderedSurface.displayName = 'BorderedSurface'
