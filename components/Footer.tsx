import { Text } from '@chakra-ui/react'
import packageJson from '../package.json'

export const Footer = () => {
  return (
    <Text as="footer" fontSize="body-s" color="text-secondary" textAlign="center" mt={8}>
      v{packageJson.version}
    </Text>
  )
}
