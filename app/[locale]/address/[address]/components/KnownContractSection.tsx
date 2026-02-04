'use client'

import { Box, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { FaXTwitter, FaTelegram, FaMedium, FaGithub, FaGlobe } from 'react-icons/fa6'
import { Card } from '@/components/ui/Card'
import { getTokenIconUrl, type TokenRegistryEntry } from '@/lib/constants/token-registry'

interface KnownContractSectionProps {
  token: TokenRegistryEntry
}

export const KnownContractSection = ({ token }: KnownContractSectionProps) => {
  const { t } = useTranslation()
  const iconUrl = getTokenIconUrl(token.icon)

  const hasLinks =
    token.website || token.links?.twitter || token.links?.telegram || token.links?.medium || token.links?.github

  return (
    <Card variant="outline" bg="bg-alt-primary" p={{ base: 4, md: 5 }}>
      <Flex gap={{ base: 4, md: 6 }} flexDirection={{ base: 'column', md: 'row' }} alignItems={{ md: 'flex-start' }}>
        {/* Token Icon */}
        {iconUrl && (
          <Box flexShrink={0}>
            <Image src={iconUrl} alt={token.name} width={64} height={64} style={{ borderRadius: '50%' }} unoptimized />
          </Box>
        )}

        {/* Token Info */}
        <Stack gap={3} flex={1}>
          <Flex alignItems="center" gap={2} flexWrap="wrap">
            <Heading as="h3" textStyle="displayXs" color="text-primary">
              {token.name}
            </Heading>
            <Text textStyle="bodyL" color="text-secondary">
              ({token.symbol})
            </Text>
          </Flex>

          {token.desc && (
            <Text textStyle="bodyM" color="text-secondary" lineClamp={4}>
              {token.desc}
            </Text>
          )}

          {/* Links */}
          {hasLinks && (
            <Flex gap={4} flexWrap="wrap" mt={1}>
              {token.website && <SocialLink href={token.website} icon={<FaGlobe />} label={t('Website')} />}
              {token.links?.twitter && <SocialLink href={token.links.twitter} icon={<FaXTwitter />} label="X" />}
              {token.links?.telegram && (
                <SocialLink href={token.links.telegram} icon={<FaTelegram />} label="Telegram" />
              )}
              {token.links?.medium && <SocialLink href={token.links.medium} icon={<FaMedium />} label="Medium" />}
              {token.links?.github && <SocialLink href={token.links.github} icon={<FaGithub />} label="GitHub" />}
            </Flex>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

interface SocialLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

const SocialLink = ({ href, icon, label }: SocialLinkProps) => {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      display="flex"
      alignItems="center"
      gap={1.5}
      color="text-alt-secondary"
      textStyle="bodyS"
      _hover={{ color: 'text-primary', textDecoration: 'underline' }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
