'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
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
    bg: 'bg-secondary',
    borderColor: 'border-primary',
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
