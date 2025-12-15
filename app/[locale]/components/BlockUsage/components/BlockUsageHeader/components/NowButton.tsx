'use client'

import { Button } from '@chakra-ui/react'
import { LuRotateCcw } from 'react-icons/lu'

interface NowButtonProps {
  onClick: () => void
}

export const NowButton = ({ onClick }: NowButtonProps) => {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      <LuRotateCcw />
      Reset
    </Button>
  )
}
