import { Text } from '@chakra-ui/react'

export const Size = ({ size }: { size: number }) => {
  return <Text>{size.toLocaleString()} Bytes</Text>
}
