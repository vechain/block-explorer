'use client'

import type { BoxProps, FlexProps } from '@chakra-ui/react'
import { Box, Flex } from '@chakra-ui/react'
import { forwardRef, useMemo } from 'react'

type SurfaceProps = FlexProps & {
  variant?: 'primary' | 'secondary'
}

const variantStyles = {
  primary: {
    bg: 'card-bg-primary',
    borderColor: 'border-primary',
  },
  secondary: {
    bg: 'card-bg-secondary',
    border: 'none',
  },
}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(({ variant = 'primary', ...props }, ref) => {
  const variantStyle = useMemo(() => variantStyles[variant], [variant])
  return (
    <Flex
      ref={ref}
      as="section"
      flexDirection="column"
      gap={6}
      color="text-primary"
      borderRadius="md"
      borderWidth="1px"
      p={5}
      backdropFilter="blur(16px)"
      {...variantStyle}
      {...props}
    />
  )
})

Surface.displayName = 'Surface'

export const SurfaceAlt = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  return <Surface ref={ref} bg="bg-alt-primary" border="none" p={{ base: '2', md: '4' }} gap="4" {...props} />
})

SurfaceAlt.displayName = 'SurfaceAlt'

export const BorderedSurface = forwardRef<HTMLDivElement, BoxProps>((props, ref) => {
  return <Box ref={ref} borderWidth="1px" borderColor="border-primary" p="4" rounded="md" {...props} />
})

BorderedSurface.displayName = 'BorderedSurface'
