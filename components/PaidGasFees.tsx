import { Flex, Text } from '@chakra-ui/react'
import { VTHOBalance } from '@/components/ui-legacy/TokenBalance'
import { VnsBadgeOrAddressLink } from '@/components/ui-legacy/VnsBadge'
import type { AddressString } from '@/lib/schemas'
import { useTranslation } from 'react-i18next'

export const PaidGasFees = ({ paid, delegator }: { paid: bigint; delegator: AddressString | null }) => {
  const { t } = useTranslation()
  return (
    <Flex alignItems="center" gap={2}>
      <VTHOBalance balance={paid} />
      {delegator && (
        <>
          <Text>{t('By')}</Text>
          <VnsBadgeOrAddressLink address={delegator} truncateAddress />
        </>
      )}
    </Flex>
  )
}
