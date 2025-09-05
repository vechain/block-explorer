import { Box, Link, Text, VStack } from '@chakra-ui/react'

const URL = 'https://vechain.atlassian.net/wiki/spaces/BE/pages/1598160935/BlockExplorer+Feedback+Gathering'

export const PrereleaseBanner = () => {
  return (
    <VStack bg="primary.300" p={2} gap={1}>
      <Box>
        <Text>
          This is a prerelease version of the{' '}
          <Text as="span" fontWeight="bold">
            VeChain Block Explorer
          </Text>
        </Text>
      </Box>
      <Box>
        <Text textAlign="center">
          Please report any bugs you find 👉{' '}
          <Link fontWeight="bold" href={URL} target="_blank">
            Report a bug
          </Link>
        </Text>
      </Box>
    </VStack>
  )
}
