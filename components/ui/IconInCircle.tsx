import { Center, type CenterProps } from '@chakra-ui/react'
import type React from 'react'
import { forwardRef } from 'react'
import type { IconBaseProps } from 'react-icons'

interface IconInCircleProps extends CenterProps {
  icon: React.ReactElement<IconBaseProps>
}

export const IconInCircle = forwardRef<HTMLDivElement, IconInCircleProps>(({ icon, ...props }, ref) => {
  return (
    <Center
      ref={ref}
      bg="bg-card-surface-2"
      border="1px solid"
      borderColor="border-surface-2"
      rounded="full"
      {...props}>
      {icon}
    </Center>
  )
})

IconInCircle.displayName = 'IconInCircle'
