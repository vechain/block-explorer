'use client'

import { Box, Container, Heading, Image, Link, VStack, Text, HStack, Flex } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import packageJson from '@/package.json'
import { Logo } from '../Logo'
import { FiExternalLink } from 'react-icons/fi'

export const Footer = () => {
  const { t } = useTranslation()
  const linkProps = {
    color: 'text.secondary',
    target: '_blank',
    rel: 'noopener noreferrer',
    _focus: {
      outline: 'none',
    },
  }
  return (
    <VStack gap={0} mt={{ base: -10, md: -40 }}>
      <Image src={'/footer-image.png'} alt="footer-image" />
      <Box bg="#0B0C10" pt={{ base: 20, md: 20 }} pb={{ base: 36, md: 20 }} width="100%">
        <Container maxW="container.lg">
          <Flex
            flexDirection={{ base: 'column', md: 'row' }}
            alignItems={{ base: 'start', md: 'center' }}
            justifyContent="center"
            gap={{ base: 12, md: 32 }}
            px={{ base: 4, md: 8 }}
          >
            <VStack alignItems={{ base: 'start', md: 'center' }} gap={2} width={{ base: '100%', md: 'auto' }}>
              <Logo h={{ base: 6, md: 8 }} />
              <Text fontSize="sm" color="gray.500">
                {t('v{{version}}', { version: packageJson.version })}
              </Text>
            </VStack>
            <HStack
              alignItems="start"
              justifyContent={{ base: 'space-evenly', md: 'start' }}
              w={{ base: 'full', md: 'auto' }}
              gap={{ base: 8, md: 12 }}
            >
              <VStack alignItems="start" justifyContent="start">
                <Heading fontSize={{ base: 'lg' }}>{t('Legal')}</Heading>
                <Link href="https://vechain.org/legal-pages/privacy-policy" {...linkProps}>
                  {t('Privacy Policy')} <FiExternalLink />
                </Link>
                <Link href="https://vechain.org/legal-pages/terms-of-use" {...linkProps}>
                  {t('Terms of Service')} <FiExternalLink />
                </Link>
                <Link href="https://vechain.org/legal-pages/cookie-policy" {...linkProps}>
                  {t('Cookie Policy')} <FiExternalLink />
                </Link>
              </VStack>
              <VStack alignItems="start" justifyContent="start">
                <Heading fontSize={{ base: 'lg' }}>{'VeChain'}</Heading>
                <Link href="https://vechain.org/" {...linkProps}>
                  {'VeChain'} <FiExternalLink />
                </Link>
                <Link href="https://stargate.vechain.org/" {...linkProps}>
                  {'StarGate'} <FiExternalLink />
                </Link>
                <Link href="https://vevote.vechain.org/" {...linkProps}>
                  {'VeVote'} <FiExternalLink />
                </Link>
                <Link href="https://support.vechain.org/" {...linkProps}>
                  {t('Support Center')} <FiExternalLink />
                </Link>
              </VStack>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </VStack>
  )
}
