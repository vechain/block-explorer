import { Box, Flex, Text } from "@chakra-ui/react"

type StatCardProps = {
  icon: React.ReactElement
  label: string
  value?: string
}

const InsightData = ({ icon, label, value }: StatCardProps) => {
  return (
    <Box bg="grey.600" borderRadius="md" m={2} display="flex" justifyContent="space-between">
      <Flex gap={3} p={4} w={"100%"} justifyContent={"space-between"}>
        <Text color="grey.300" fontWeight="bold">
          {icon}
          {label}
        </Text>
        <Text color="grey.300" fontWeight="bold">
          {value}
        </Text>
      </Flex>
    </Box>
  )
}

export default InsightData
