import { Text } from '@chakra-ui/react'
import packageJson from '../package.json'

// Use build-time injected version from CI/CD, fallback to package.json for local development
// Strip "v." prefix from git tags (e.g., "v.1.5.1" -> "1.5.1")
const rawVersion = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version
const appVersion = rawVersion.replace(/^v\./, '')

export const Footer = () => {
  return (
    <Text as="footer" fontSize="body-s" color="text-secondary" textAlign="center" mt={8}>
      {appVersion}
    </Text>
  )
}
