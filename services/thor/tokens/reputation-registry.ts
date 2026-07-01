import { useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

const AGENT_REPUTATION_QUERY_KEY = 'getAgentReputation'

// ABI fragments for the agent-marketplace ERC-8004 ReputationRegistry reads.
const REPUTATION_REGISTRY_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }],
    name: 'getClients',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'agentId', type: 'uint256' },
      { internalType: 'address[]', name: 'clientAddresses', type: 'address[]' },
      { internalType: 'string', name: 'tag1', type: 'string' },
      { internalType: 'string', name: 'tag2', type: 'string' },
    ],
    name: 'getSummary',
    outputs: [
      { internalType: 'uint64', name: 'count', type: 'uint64' },
      { internalType: 'int256', name: 'summaryValue', type: 'int256' },
      { internalType: 'uint8', name: 'summaryValueDecimals', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'agentId', type: 'uint256' },
      { internalType: 'address[]', name: 'clientAddresses', type: 'address[]' },
      { internalType: 'string', name: 'tag1', type: 'string' },
      { internalType: 'string', name: 'tag2', type: 'string' },
      { internalType: 'bool', name: 'includeRevoked', type: 'bool' },
    ],
    name: 'readAllFeedback',
    outputs: [
      { internalType: 'address[]', name: 'clients', type: 'address[]' },
      { internalType: 'uint64[]', name: 'feedbackIndexes', type: 'uint64[]' },
      { internalType: 'int128[]', name: 'feedbackValues', type: 'int128[]' },
      { internalType: 'uint8[]', name: 'valueDecimalsList', type: 'uint8[]' },
      { internalType: 'bool[]', name: 'revokedStatuses', type: 'bool[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface AgentFeedbackEntry {
  client: AddressString
  index: number
  /** Feedback value normalised by its on-chain `valueDecimals`. */
  value: number
  revoked: boolean
}

export interface AgentReputation {
  /** Total non-revoked feedback entries. */
  feedbackCount: number
  /** Distinct clients that have left feedback. */
  clientCount: number
  /** Mean feedback value (sum / count) normalised by decimals, or null when empty. */
  averageValue: number | null
  feedback: AgentFeedbackEntry[]
}

const EMPTY_REPUTATION: AgentReputation = {
  feedbackCount: 0,
  clientCount: 0,
  averageValue: null,
  feedback: [],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toArray = (value: any): any[] => (Array.isArray(value) ? value : [])

const getAgentReputation = async (
  networkName: NetworkName,
  reputationAddress: AddressString,
  agentId: bigint,
): Promise<AgentReputation> => {
  try {
    const thorClient = getThorClient(networkName)
    const contract = thorClient.contracts.load(reputationAddress, REPUTATION_REGISTRY_ABI)

    const [rawClients] = await contract.read.getClients(agentId)
    const clients = toArray(rawClients) as AddressString[]
    if (clients.length === 0) return EMPTY_REPUTATION

    const [count, summaryValue, summaryValueDecimals] = await contract.read.getSummary(agentId, clients, '', '')
    const [feedbackClients, feedbackIndexes, feedbackValues, valueDecimalsList, revokedStatuses] =
      await contract.read.readAllFeedback(agentId, clients, '', '', false)

    const decimals = Number(summaryValueDecimals ?? 0)
    const feedbackCount = Number(count ?? 0)
    const sum = Number(summaryValue ?? 0) / 10 ** decimals
    const averageValue = feedbackCount > 0 ? sum / feedbackCount : null

    const fbClients = toArray(feedbackClients)
    const fbIndexes = toArray(feedbackIndexes)
    const fbValues = toArray(feedbackValues)
    const fbDecimals = toArray(valueDecimalsList)
    const fbRevoked = toArray(revokedStatuses)

    const feedback: AgentFeedbackEntry[] = fbClients.map((client, i) => ({
      client: client as AddressString,
      index: Number(fbIndexes[i] ?? 0),
      value: Number(fbValues[i] ?? 0) / 10 ** Number(fbDecimals[i] ?? 0),
      revoked: Boolean(fbRevoked[i]),
    }))

    return {
      feedbackCount,
      clientCount: clients.length,
      averageValue,
      feedback,
    }
  } catch (error) {
    console.error('Error fetching agent reputation:', error)
    return EMPTY_REPUTATION
  }
}

export const useAgentReputation = ({
  reputationAddress,
  agentId,
}: {
  reputationAddress: AddressString | null | undefined
  agentId: bigint
}) => {
  const { activeNetwork } = useSettingsStore()

  return useQuery({
    queryKey: [AGENT_REPUTATION_QUERY_KEY, activeNetwork.name, reputationAddress ?? '', agentId.toString()],
    queryFn: () => getAgentReputation(activeNetwork.name, reputationAddress as AddressString, agentId),
    enabled: !!reputationAddress,
    staleTime: 60_000,
  })
}
