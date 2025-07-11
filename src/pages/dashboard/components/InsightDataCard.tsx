import { Box, Flex, Text, Skeleton } from "@chakra-ui/react"

type StatCardProps = {
  /**
   * An icon element to be displayed alongside the label.
   * Example: A React component representing an SVG or icon, such as <Icon />.
   */
  icon: React.ReactElement

  /**
   * A string representing the label for the data being displayed.
   * Example: "Block Number", "Total Transactions".
   */
  label: string

  /**
   * The value to display, which can be any React node (e.g., a string, number, or React element).
   * Example: "123,456", <Skeleton />, or custom elements.
   * Default: `undefined` (no value displayed).
   */
  value?: React.ReactNode

  /**
   * A boolean indicating whether the data is in a loading state.
   * If true, a skeleton loader is displayed instead of the value.
   * Example: `true` or `false`.
   * Default: `false` (no loading skeleton is shown).
   */
  loading?: boolean
}

const InsightDataCard = ({ icon, label, value, loading }: StatCardProps) => {
  return (
    <Box bg="grey.600" borderRadius="md" m={2} display="flex" justifyContent="space-between">
      <Flex gap={3} p={4} w={"100%"} justifyContent={"space-between"}>
        <Text color="grey.300" fontWeight="bold" display="flex" alignItems="center" gap={2}>
          {icon}
          {label}
        </Text>
        <Box textAlign="right" color="grey.300" fontWeight="bold">
          {loading ? <Skeleton height="20px" width="100px" /> : value}
        </Box>
      </Flex>
    </Box>
  )
}

export default InsightDataCard
