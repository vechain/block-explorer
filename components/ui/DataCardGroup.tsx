'use client'

import { Box, Flex, type FlexProps, Group, Text, useBreakpointValue, Grid } from '@chakra-ui/react'
import React from 'react'
import type { IconBaseProps } from 'react-icons'
import { IconInCircle } from './IconInCircle'
import { InfoTip } from './InfoTip'
import { Card, type CardVariant } from './Card'

export interface DataCardGroupItem {
  icon?: React.ReactElement<IconBaseProps>
  title: string
  tooltip?: string
  children: React.ReactNode
}

interface DataCardGroupProps {
  /** Items to display in the card group */
  items: DataCardGroupItem[]
  /** Size of the icon */
  iconSize?: number | string
  /** Variant of the card */
  variant?: CardVariant
  /** Additional props passed to each card in desktop mode */
  cardProps?: FlexProps
  /** Additional props passed to each card in mobile mode */
  mobileCardProps?: FlexProps
  /** Force single card layout on all screen sizes */
  singleCard?: boolean
  /** Number of columns to display on desktop */
  desktopColumns?: number
  /** Gap between cards on desktop */
  desktopGap?: number
  /** Hide the card group on all screen sizes */
  hidden?: boolean
}

export const DataCardGroup = ({
  items,
  iconSize = 12,
  variant = 'secondary',
  desktopColumns = 2,
  desktopGap = 4,
  cardProps,
  mobileCardProps,
  singleCard = false,
  hidden = false,
}: DataCardGroupProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Desktop: render separate cards (unless singleCard is true)
  if (!isMobile && !singleCard) {
    return (
      <Grid
        templateColumns={`repeat(${desktopColumns}, 1fr)`}
        flex="1"
        alignSelf="stretch"
        minWidth="0"
        gap={desktopGap}
        hidden={hidden}
      >
        {items.map((item, index) => {
          const Icon = item.icon
            ? React.cloneElement(item.icon, { ...item.icon.props, width: iconSize, height: iconSize })
            : undefined
          return (
            <Card key={index} variant={variant} flex="1" alignSelf="stretch" minWidth="0" {...cardProps}>
              <Flex alignItems="center" justifyContent="space-between">
                <Group>
                  {Icon && <IconInCircle icon={Icon} p="1" />}
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
      </Grid>
    )
  }

  // Mobile: render single card with separator lines
  return (
    <Card variant={variant} flex="1" gap="0" py="1" {...mobileCardProps} hidden={hidden}>
      {items.map((item, index) => {
        const Icon = item.icon
          ? React.cloneElement(item.icon, { ...item.icon.props, width: iconSize, height: iconSize })
          : undefined
        const isLast = index === items.length - 1

        return (
          <Box key={index} py="3" borderBottomWidth={isLast ? '0' : '1px'} borderColor="border-primary">
            <Flex alignItems="center" justifyContent="space-between">
              <Group>
                {Icon && <IconInCircle icon={Icon} p="1" />}
                <Text whiteSpace="nowrap" textStyle="bodyM" color="text-primary">
                  {item.title}
                </Text>
              </Group>
              {item.children}
              {item.tooltip && <InfoTip tooltip={item.tooltip} />}
            </Flex>
          </Box>
        )
      })}
    </Card>
  )
}
