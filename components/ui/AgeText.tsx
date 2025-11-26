import { Text, type TextProps } from '@chakra-ui/react'
import { formatDistanceToNow } from 'date-fns'
import { HiOutlineBolt } from 'react-icons/hi2'

export const AgeText = ({ timestamp, ...props }: { timestamp: number } & TextProps) => {
  return (
    <Text color="highlight-secondary" display="flex" alignItems="center" textTransform="capitalize" gap={1} {...props}>
      <HiOutlineBolt size={16} />
      {formatDistanceToNow(new Date(timestamp), { includeSeconds: true })}
    </Text>
  )
}
