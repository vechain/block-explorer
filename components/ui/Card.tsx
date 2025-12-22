'use client'

import type { FlexProps } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
import { forwardRef, useMemo } from 'react'

type CardProps = FlexProps & {
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

export const Card = forwardRef<HTMLDivElement, CardProps>(({ variant = 'primary', ...props }, ref) => {
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
      p={{ base: 4, md: 5 }}
      backdropFilter="blur(16px)"
      {...variantStyle}
      {...props}
    />
  )
})

Card.displayName = 'Card'
