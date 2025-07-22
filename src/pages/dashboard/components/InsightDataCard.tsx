import { useBestBlock } from "@/services/thor/block/hooks"
import { Flex, Text, Skeleton, Stack, Icon, Heading } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuArrowLeftRight, LuBox, LuUserCheck } from "react-icons/lu"

export const BlockNumberCard = () => {
  const { t } = useTranslation()
  const { data: bestBlock, isPending } = useBestBlock()

  const blockNumber = bestBlock?.number.toLocaleString() || "-"

  return <InsightDataCard label={t("block_number")} value={blockNumber} isPending={isPending} icon={<LuBox />} />
}

export const TotalTransactionsCard = () => {
  const { t } = useTranslation()
  const { isPending } = useBestBlock()

  const totalTransactions = Number(123456789).toLocaleString()

  return (
    <InsightDataCard
      label={t("total_transactions")}
      value={totalTransactions}
      isPending={isPending}
      icon={<LuArrowLeftRight />}
    />
  )
}

export const ValidatorNodesCard = () => {
  const { t } = useTranslation()
  const { isPending } = useBestBlock()

  const validatorNodes = Number(12345).toLocaleString()

  return (
    <InsightDataCard label={t("validator_nodes")} value={validatorNodes} isPending={isPending} icon={<LuUserCheck />} />
  )
}

type InsightDataCardProps = {
  label: string
  value: string
  isPending: boolean
  icon: React.ReactElement
}

const InsightDataCard = ({ icon, label, value, isPending }: InsightDataCardProps) => {
  const circle = { rounded: "full", border: "1px solid", borderColor: "border.emphasized", p: 1 }

  return (
    <Flex gap={6} borderRadius="xl" px={6} py={10} bg="bg.emphasized" flex={1}>
      <Stack flex={1}>
        <Heading as="h4" size="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase">
          {label}
        </Heading>
        {isPending ? (
          <Skeleton height="30px" width="80%" bg="fg.muted" />
        ) : (
          <Text fontSize="2xl" fontWeight="bold" color="fg">
            {value}
          </Text>
        )}
      </Stack>

      <Flex w="60px" h="60px" alignItems="center" justifyContent="center" {...circle}>
        <Flex w="100%" h="100%" alignItems="center" justifyContent="center" {...circle}>
          <Icon w="20px" h="20px" color="fg">
            {icon}
          </Icon>
        </Flex>
      </Flex>
    </Flex>
  )
}
