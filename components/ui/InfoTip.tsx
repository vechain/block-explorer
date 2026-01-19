'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { Tooltip } from './Tooltip'

export const InfoTip = ({ tooltip }: { tooltip: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }, [])

  const handleOpenChange = useCallback((details: { open: boolean }) => {
    setIsOpen(details.open)
  }, [])

  return (
    <Tooltip content={tooltip} open={isOpen} onOpenChange={handleOpenChange} interactive>
      <button
        type="button"
        onClick={handleClick}
        aria-label="More information"
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        <Image src="/icons/info.svg" alt="Info" width={16} height={16} />
      </button>
    </Tooltip>
  )
}
