import type { HexString, Transaction } from '@/lib/schemas'

const GENERIC_VM_ERROR = 'execution reverted'
const POSSIBLE_SELECTOR_MISMATCH_MAX_GAS_USED = 5000

type ClauseSimulationLike = {
  reverted: boolean
  data?: string | null
  vmError?: string | null
  gasUsed?: bigint | number | null
}

export type PossibleSelectorMismatch = {
  clauseIndex: number
  selector: HexString
}

export const getPossibleSelectorMismatch = ({
  transaction,
  simulations,
}: {
  transaction: Transaction
  simulations: ClauseSimulationLike[]
}): PossibleSelectorMismatch | null => {
  const clauseIndex = simulations.findIndex(simulation => simulation.reverted)

  if (clauseIndex === -1) {
    return null
  }

  const simulation = simulations[clauseIndex]
  const clause = transaction.clauses[clauseIndex]
  const selector = getSelector(clause?.data)
  const gasUsed = Number(simulation?.gasUsed ?? 0)
  const hasDecodedReason = !!simulation?.data && simulation.data !== '0x'
  const vmError = simulation?.vmError?.trim()
  const hasSpecificVmError = !!vmError && vmError !== GENERIC_VM_ERROR

  if (!clause?.to || !selector) {
    return null
  }

  if (hasDecodedReason || hasSpecificVmError || gasUsed > POSSIBLE_SELECTOR_MISMATCH_MAX_GAS_USED) {
    return null
  }

  return {
    clauseIndex,
    selector,
  }
}

const getSelector = (data: string | undefined): HexString | null => {
  if (!data || data.length < 10) {
    return null
  }

  return data.slice(0, 10) as HexString
}
