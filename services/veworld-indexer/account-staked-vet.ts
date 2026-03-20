import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { accountStakedVetQueryOptions } from '@/services/thor/staked-vet'
import { useValidators, ValidatorStatus } from './validators'

export const useAccountStakedVet = (address: AddressString | undefined) => {
  const { activeNetwork } = useSettingsStore()

  const { data: directStakedVet, isPending: isDirectPending } = useQuery(
    accountStakedVetQueryOptions(activeNetwork.name, address),
  )

  const { data: endorsedValidators, isPending: isValidatorsPending } = useValidators(
    address ? { endorser: address } : undefined,
  )

  const delegationStake = directStakedVet ?? 0n

  const validatorStake = useMemo(() => {
    return (
      endorsedValidators
        ?.filter(v => v.status !== ValidatorStatus.EXITED)
        .reduce((sum, v) => {
          const vetInWei = BigInt(Math.floor(v.validatorVetStaked ?? 0)) * 10n ** 18n
          return sum + vetInWei
        }, 0n) ?? 0n
    )
  }, [endorsedValidators])

  const totalStakedVet = useMemo(() => {
    return delegationStake + validatorStake
  }, [delegationStake, validatorStake])

  return {
    data: totalStakedVet,
    delegationStake,
    validatorStake,
    isPending: isDirectPending || isValidatorsPending,
  }
}
