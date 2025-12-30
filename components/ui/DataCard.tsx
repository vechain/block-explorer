'use client'

import { Flex, type FlexProps, Group, Text } from '@chakra-ui/react'
import React, { forwardRef } from 'react'
import type { IconBaseProps } from 'react-icons'
import { IconInCircle } from './IconInCircle'
import { InfoTip } from './InfoTip'
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
      <Card variant="secondary" ref={ref} flex="1" alignSelf="stretch" {...props}>
        <Flex alignItems="center" justifyContent="space-between">
          <Group>
            <IconInCircle icon={Icon} p="1" />
            <Text whiteSpace="nowrap" textStyle="bodyM" color="text-primary">
              {title}
            </Text>
          </Group>
          {tooltip && <InfoTip tooltip={tooltip} />}
        </Flex>
        {children}
      </Card>
    )
  },
)

DataCard.displayName = 'DataCard'
