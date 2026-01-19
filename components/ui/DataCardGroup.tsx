'use client'

import { Box, Flex, type FlexProps, Group, Text, useBreakpointValue } from '@chakra-ui/react'
import React from 'react'
import type { IconBaseProps } from 'react-icons'
import { IconInCircle } from './IconInCircle'
import { InfoTip } from './InfoTip'
import { Card, type CardVariant } from './Card'

export interface DataCardGroupItem {
  icon: React.ReactElement<IconBaseProps>
  title: string
  tooltip?: string
  children: React.ReactNode
}

interface DataCardGroupProps {
  items: DataCardGroupItem[]
  iconSize?: number | string
  variant?: CardVariant
  /** Additional props passed to each card in desktop mode */
  cardProps?: FlexProps
}

export const DataCardGroup = ({ items, iconSize = 12, variant = 'secondary', cardProps }: DataCardGroupProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Desktop: render separate cards
  if (!isMobile) {
    return (
      <>
        {items.map((item, index) => {
          const Icon = React.cloneElement(item.icon, { ...item.icon.props, width: iconSize, height: iconSize })
          return (
            <Card key={index} variant={variant} flex="1" alignSelf="stretch" minWidth="0" {...cardProps}>
              <Flex alignItems="center" justifyContent="space-between">
                <Group>
                  <IconInCircle icon={Icon} p="1" />
                  <Text whiteSpace="nowrap" textStyle="bodyM" color="text-primary">
                    {item.title}
                  </Text>
                </Group>
                {item.tooltip && <InfoTip tooltip={item.tooltip} />}
              </Flex>
              {item.children}
            </Card>
          )
        })}
      </>
    )
  }

  // Mobile: render single card with separator lines
  return (
    <Card variant={variant} width="100%">
      {items.map((item, index) => {
        const Icon = React.cloneElement(item.icon, { ...item.icon.props, width: iconSize, height: iconSize })
        const isLast = index === items.length - 1

        return (
          <Box
            key={index}
            py="3"
            borderBottomWidth={isLast ? '0' : '1px'}
            borderColor="border-primary"
            _first={{ pt: 0 }}
            _last={{ pb: 0 }}
          >
            <Flex alignItems="center" justifyContent="space-between" mb="2">
              <Group>
                <IconInCircle icon={Icon} p="1" />
                <Text whiteSpace="nowrap" textStyle="bodyM" color="text-primary">
                  {item.title}
                </Text>
              </Group>
              {item.tooltip && <InfoTip tooltip={item.tooltip} />}
            </Flex>
            {item.children}
          </Box>
        )
      })}
    </Card>
  )
}
