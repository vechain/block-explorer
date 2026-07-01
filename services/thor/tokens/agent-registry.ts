import { useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

const AGENT_INFO_QUERY_KEY = 'getAgentInfo'

// ABI fragment for the agent-marketplace AgentRegistry `getAgent` view.
const AGENT_REGISTRY_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'agentId', type: 'uint256' }],
    name: 'getAgent',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'creator', type: 'address' },
          { internalType: 'uint64', name: 'registeredAt', type: 'uint64' },
          { internalType: 'bool', name: 'suspended', type: 'bool' },
          { internalType: 'bool', name: 'deactivated', type: 'bool' },
        ],
        internalType: 'struct IAgentRegistry.AgentInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface AgentInfo {
  creator: AddressString
  /** Registration timestamp in milliseconds. */
  registeredAt: number
  suspended: boolean
  deactivated: boolean
}

const getAgentInfo = async (
  networkName: NetworkName,
  contractAddress: AddressString,
  agentId: bigint,
): Promise<AgentInfo | null> => {
  try {
    const thorClient = getThorClient(networkName)
    const contract = thorClient.contracts.load(contractAddress, AGENT_REGISTRY_ABI)
    const [info] = await contract.read.getAgent(agentId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agent = info as any
    return {
      creator: (agent.creator ?? agent[0]) as AddressString,
      registeredAt: Number(agent.registeredAt ?? agent[1]) * 1000,
      suspended: Boolean(agent.suspended ?? agent[2]),
      deactivated: Boolean(agent.deactivated ?? agent[3]),
    }
  } catch (error) {
    console.error('Error fetching agent info:', error)
    return null
  }
}

export const useAgentInfo = ({ contractAddress, agentId }: { contractAddress: AddressString; agentId: bigint }) => {
  const { activeNetwork } = useSettingsStore()

  return useQuery({
    queryKey: [AGENT_INFO_QUERY_KEY, activeNetwork.name, contractAddress, agentId.toString()],
    queryFn: () => getAgentInfo(activeNetwork.name, contractAddress, agentId),
    staleTime: 60_000,
  })
}
