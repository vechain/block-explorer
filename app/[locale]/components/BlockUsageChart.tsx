'use client'

import { Box, Heading, Stack } from '@chakra-ui/react'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { LinearGradient } from '@visx/gradient'
import { Group } from '@visx/group'
import { scaleBand, scaleLinear } from '@visx/scale'
import { Bar } from '@visx/shape'
import { defaultStyles, useTooltip, useTooltipInPortal } from '@visx/tooltip'
import { datetimeFormat, timeFormat } from '@/lib/utils/date'
import { useLatestBlocks } from '@/services/thor/hooks'

const topMargin = 32
const bottomMargin = 32
const rightMargin = 16
const leftMargin = 32

const width = 1000
const height = 400

const xMin = leftMargin
const xMax = width - rightMargin
const yMin = topMargin
const yMax = height - bottomMargin

const MAX_BLOCKS_COUNT = 100

type Datum = {
  id: string
  gasLimit: number
  gasUsed: number
  number: number
  timestamp: number
}

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
}

// accessors
const getGasLimit = (d: Datum) => d.gasLimit
const getGasUsed = (d: Datum) => d.gasUsed
const getTimestamp = (d: Datum) => d.timestamp

export const BlockUsageChart = () => {
  const data = useBlockUsageChartData()

  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } = useTooltip<Datum>()

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  })

  const xScale = scaleBand<number>({
    range: [xMin, xMax],
    round: true,
    domain: data.map(getTimestamp),
    padding: 0.2,
  })

  const yScale = scaleLinear<number>({
    range: [yMax, yMin],
    round: true,
    domain: [0, Math.max(...data.map(getGasLimit))],
  })

  let tooltipTimeout: number

  const handleMouseMove = (d: Datum) => (event: React.MouseEvent<SVGRectElement>) => {
    if (tooltipTimeout) clearTimeout(tooltipTimeout)

    const tooltipData = data.find(({ id }) => id === d.id)
    const tooltipTop = event.nativeEvent.offsetY
    const tooltipLeft = event.nativeEvent.offsetX

    if (tooltipLeft && tooltipTop && tooltipData) {
      showTooltip({ tooltipData, tooltipTop, tooltipLeft })
    }
  }

  const handleMouseLeave = () => {
    tooltipTimeout = window.setTimeout(() => {
      hideTooltip()
    }, 300)
  }

  return (
    <Stack flex={1} gap={4} bg="bg.muted" rounded="xl" p={8}>
      <Heading as="h2" size="2xl" fontWeight="bold" color="fg">
        Block Usage
      </Heading>

      <Box flex={1}>
        <svg
          ref={containerRef}
          width="100%"
          height="100%"
          role="img"
          aria-label="Chart"
          viewBox={`0 0 ${width} ${height}`}>
          <GreenToRedGradient />
          <Group>
            {data.map(d => {
              const barHeight = yMax - yScale(getGasUsed(d))
              const barWidth = xScale.bandwidth()
              const barX = xScale(getTimestamp(d))
              const barY = yMax - barHeight
              return (
                <Bar
                  key={d.id}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#greenToRed)"
                  onMouseMove={handleMouseMove(d)}
                  onMouseLeave={handleMouseLeave}
                  //* add onClick to visit block page ?
                />
              )
            })}
          </Group>

          <Group>
            <AxisLeft
              left={leftMargin}
              scale={yScale}
              tickFormat={value => `${(Number(value) / 10 ** 6).toLocaleString()}M`}
              tickLabelProps={() => ({
                textAnchor: 'end',
                dx: '-0.35rem',
                style: { fontSize: '0.7rem', paddingRight: 10 },
              })}
            />
          </Group>

          <Group>
            <AxisBottom
              top={yMax}
              scale={xScale}
              tickFormat={timestamp => timeFormat(timestamp)}
              tickLabelProps={() => ({
                textAnchor: 'middle',
                style: { fontSize: '0.7rem' },
              })}
            />
          </Group>

          {tooltipOpen && tooltipData && (
            <Group>
              <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
                <Stack>
                  <div>Block Number: {tooltipData.number.toLocaleString()}</div>
                  <div>Gas limit: {tooltipData.gasLimit.toLocaleString()}</div>
                  <div>Gas used: {tooltipData.gasUsed.toLocaleString()}</div>
                  <div>Usage: {((tooltipData.gasUsed / tooltipData.gasLimit) * 100).toFixed(2)}%</div>
                  <strong>{datetimeFormat(tooltipData.timestamp)}</strong>
                </Stack>
              </TooltipInPortal>
            </Group>
          )}
        </svg>
      </Box>
    </Stack>
  )
}

const GreenToRedGradient = () => {
  return (
    <LinearGradient id="greenToRed" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="red" />
      <stop offset="50%" stopColor="yellow" />
      <stop offset="100%" stopColor="green" />
    </LinearGradient>
  )
}

const useBlockUsageChartData = () => {
  const { data = [] } = useLatestBlocks({ count: MAX_BLOCKS_COUNT })
  return data
    .reverse()
    .map(({ id, gasUsed, gasLimit, number, timestamp }) => ({ id, gasUsed, gasLimit, number, timestamp }))
}
