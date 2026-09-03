'use client'

import { Box, Flex, HStack, Skeleton, Stack, Text, VStack } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { MotionText } from '@/components/ui/MotionText'
import { useFormatAmount, useFormatNumber } from '@/hooks/useFormatting'
import { useNowSeconds } from '@/hooks/useNowSeconds'
import { BLOCK_TIME_MS } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { type ClockPalette, createScene, renderBlockClock } from './draw'
import { type BlockClockFeed, useBlockClockFeed } from './useBlockClockFeed'

const FALLBACK_PALETTE: ClockPalette = {
  accent: 'rgba(184, 166, 255, 1)',
  accentAlt: 'rgba(231, 130, 255, 1)',
  warm: 'rgba(242, 178, 90, 1)',
  ink: 'rgba(238, 243, 247, 1)',
}

const readPalette = (element: Element): ClockPalette => {
  const style = getComputedStyle(element)
  const read = (token: string, fallback: string) =>
    style.getPropertyValue(`--chakra-colors-${token}`).trim() || fallback
  return {
    accent: read('accent-primary', FALLBACK_PALETTE.accent),
    accentAlt: read('accent-secondary', FALLBACK_PALETTE.accentAlt),
    warm: read('accent-warm', FALLBACK_PALETTE.warm),
    ink: read('text-primary', FALLBACK_PALETTE.ink),
  }
}

const useClockCanvas = (feed: BlockClockFeed) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const feedRef = useRef(feed)

  useEffect(() => {
    feedRef.current = feed
  }, [feed])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const scene = createScene()
    const palette = readPalette(canvas)
    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize)
    if (observer) observer.observe(canvas)
    else resize()

    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let last = performance.now()
    const tick = (time: number) => {
      const dt = Math.min(0.1, (time - last) / 1000)
      last = time
      if (width > 0) {
        renderBlockClock({ ctx, scene, feed: feedRef.current, width, height, now: Date.now(), dt, palette, animate })
      }
      schedule()
    }
    const schedule = () => {
      if (animate) frame = requestAnimationFrame(tick)
      else timer = setTimeout(() => tick(performance.now()), 500)
    }
    schedule()

    return () => {
      observer?.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [])

  return canvasRef
}

const Stat = ({ label, value }: { label: string; value: string | undefined }) => (
  <VStack gap={0} alignItems="flex-start">
    <Text textStyle="bodyS" color="text-secondary">
      {label}
    </Text>
    {value === undefined ? (
      <Skeleton height="20px" width="64px" />
    ) : (
      <Text textStyle="bodyMSemibold" color="text-primary" fontVariantNumeric="tabular-nums">
        {value}
      </Text>
    )}
  </VStack>
)

const BlockClockPanel = () => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const formatAmount = useFormatAmount()
  const feed = useBlockClockFeed()
  const canvasRef = useClockCanvas(feed)
  const nowSeconds = useNowSeconds()
  const { head } = feed
  const seconds = head === undefined ? undefined : Math.max(0, nowSeconds - Math.floor(head.seenAt / 1000))

  const overdue = seconds !== undefined && seconds * 1000 > BLOCK_TIME_MS
  const vtho = head?.totalVthoPaid === undefined ? undefined : formatAmount({ amount: head.totalVthoPaid })[0]
  const lastBlock = (
    <Stack direction={{ base: 'row', md: 'column' }} gap={{ base: 6, md: 3 }} alignItems="flex-start" flexWrap="wrap">
      <Stat label={t('Transactions')} value={head && formatNumber(head.txCount)} />
      <Stat label={t('Clauses')} value={head?.clauseCount === undefined ? undefined : formatNumber(head.clauseCount)} />
      <Stat label={t('VTHO Paid')} value={vtho} />
    </Stack>
  )

  return (
    <Card p={0} gap={0} overflow="hidden">
      <Box position="relative" w="full" aspectRatio={{ base: '1 / 1', md: '1080 / 380' }} maxH="440px">
        <Box asChild position="absolute" inset={0} w="full" h="full">
          <canvas ref={canvasRef} role="img" aria-label={t('Block clock')} />
        </Box>

        <HStack position="absolute" top={4} left={5} gap={2} pointerEvents="none">
          <Box
            boxSize="8px"
            borderRadius="full"
            bg={feed.live ? 'accent-secondary' : 'text-secondary'}
            boxShadow={feed.live ? '0 0 10px var(--chakra-colors-accent-secondary)' : 'none'}
          />
          <Text textStyle="bodyS" color="text-secondary" letterSpacing="0.08em" textTransform="uppercase">
            {feed.live ? t('Live') : t('Polling')}
          </Text>
        </HStack>

        <Flex position="absolute" inset={0} alignItems="center" justifyContent="center" pointerEvents="none">
          <VStack gap={1} textAlign="center">
            <Text textStyle="bodyS" color="text-secondary" letterSpacing="0.08em" textTransform="uppercase">
              {t('Block height')}
            </Text>
            {head ? (
              <MotionText
                key={head.number}
                textStyle={{ base: 'displayS', md: 'displayM' }}
                color="text-primary"
                fontVariantNumeric="tabular-nums"
                initial={{ opacity: 0.2, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {formatNumber(head.number)}
              </MotionText>
            ) : (
              <Skeleton height="36px" width="160px" />
            )}
            <Text
              textStyle="bodyS"
              color={overdue ? 'accent-warm' : 'accent-primary'}
              fontVariantNumeric="tabular-nums"
            >
              {t('{{count}} pending', { count: feed.pending })}
              {seconds === undefined
                ? null
                : ` · ${formatNumber(seconds, { style: 'unit', unit: 'second', unitDisplay: 'narrow' })}`}
            </Text>
          </VStack>
        </Flex>

        <Box
          position="absolute"
          right={6}
          top="50%"
          transform="translateY(-50%)"
          display={{ base: 'none', md: 'block' }}
          pointerEvents="none"
        >
          <Text textStyle="bodyS" color="text-secondary" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
            {t('Last block')}
          </Text>
          {lastBlock}
        </Box>
      </Box>

      <Box display={{ base: 'block', md: 'none' }} px={4} pb={4}>
        <Text textStyle="bodyS" color="text-secondary" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
          {t('Last block')}
        </Text>
        {lastBlock}
      </Box>
    </Card>
  )
}

export const BlockClock = () => {
  const networkName = useSettingsStore(state => state.activeNetwork.name)
  // Remount on a network switch so the dial and pending count start clean.
  return <BlockClockPanel key={networkName} />
}
