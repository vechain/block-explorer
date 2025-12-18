'use client'

import { Flex, type FlexProps, Group, Text } from '@chakra-ui/react'
import Image from 'next/image'
import React, { forwardRef } from 'react'
import type { IconBaseProps } from 'react-icons'
import { IconInCircle } from './IconInCircle'
import { Tooltip } from './Tooltip'
import { Card } from './Card'

interface DataCardProps extends FlexProps {
  icon: React.ReactElement<IconBaseProps>
  title: string
  tooltip?: string
  iconSize?: number | string
}

export const DataCard = forwardRef<HTMLDivElement, DataCardProps>(
  ({ children, icon, title, tooltip, iconSize = 12, ...props }, ref) => {
    const Icon = React.cloneElement(icon, { ...icon.props, width: iconSize, height: iconSize })

    return (
      <Card variant="secondary" ref={ref} flex="1" {...props}>
        <Flex alignItems="center" justifyContent="space-between">
          <Group>
            <IconInCircle icon={Icon} p="1" />
            <Text whiteSpace="nowrap" textStyle="bodyM">
              {title}
            </Text>
          </Group>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Image src="/icons/info.svg" alt="Info" width={16} height={16} />
            </Tooltip>
          )}
        </Flex>
        {children}
      </Card>
    )
  },
)

DataCard.displayName = 'DataCard'
