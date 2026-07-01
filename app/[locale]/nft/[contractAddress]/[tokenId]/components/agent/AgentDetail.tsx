'use client'

import { Box, EmptyState, Flex, Stack, Text } from '@chakra-ui/react'
import { LuInbox } from 'react-icons/lu'

/** Label/value row used across the agent tabs. Mirrors the NFT details layout. */
export const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Flex
    justifyContent="space-between"
    alignItems="center"
    py={4}
    px={{ base: 4, md: 6 }}
    borderBottomWidth="1px"
    borderColor="border-primary"
    _last={{ borderBottomWidth: 0 }}
    gap={{ base: 2, md: 4 }}
  >
    <Text textStyle="bodyM" color="text-primary" minWidth={{ base: '80px', md: '120px' }} flexShrink={0}>
      {label}
    </Text>
    <Box overflow="hidden" textAlign="right" minWidth={0}>
      {children}
    </Box>
  </Flex>
)

/** Titled, bordered container grouping a set of rows. */
export const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Stack gap={5}>
    <Text textStyle="bodyL" color="text-primary">
      {title}
    </Text>
    <Box borderWidth="1px" borderColor="border-primary" borderRadius="lg" overflow="hidden">
      {children}
    </Box>
  </Stack>
)

/** Shared empty-state placeholder for reputation-backed tabs with no data yet. */
export const AgentEmptyState = ({ title, description }: { title: string; description: string }) => (
  <EmptyState.Root size="md">
    <EmptyState.Content>
      <EmptyState.Indicator>
        <LuInbox />
      </EmptyState.Indicator>
      <EmptyState.Title>{title}</EmptyState.Title>
      <EmptyState.Description>{description}</EmptyState.Description>
    </EmptyState.Content>
  </EmptyState.Root>
)
