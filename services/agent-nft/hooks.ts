import { useQuery } from '@tanstack/react-query'
import { fetchNftJson } from '@/services/nft-metadata'
import { type AgentCard, agentCardSchema, type AgentRegistration, agentRegistrationSchema } from './schemas'

const AGENT_REGISTRATION_QUERY_KEY = 'getAgentRegistration'
const AGENT_CARD_QUERY_KEY = 'getAgentCard'

/**
 * Fetch and parse an NFT's `tokenURI` JSON as an agent registration file.
 * Returns `null` for any NFT whose metadata is not an agent registration file,
 * so callers can branch on the result without throwing.
 */
const getAgentRegistration = async (uri: string): Promise<AgentRegistration | null> => {
  const result = agentRegistrationSchema.safeParse(await fetchNftJson(uri))
  return result.success ? result.data : null
}

export const useAgentRegistration = ({ tokenUri }: { tokenUri: string | null | undefined }) =>
  useQuery({
    queryKey: [AGENT_REGISTRATION_QUERY_KEY, tokenUri],
    queryFn: () => getAgentRegistration(tokenUri ?? ''),
    enabled: !!tokenUri,
    staleTime: Infinity,
  })

/**
 * Fetch the A2A AgentCard from the registration file's `A2A` service endpoint.
 * Returns `null` when the document does not parse as an AgentCard.
 */
const getAgentCard = async (endpoint: string): Promise<AgentCard | null> => {
  const result = agentCardSchema.safeParse(await fetchNftJson(endpoint))
  return result.success ? result.data : null
}

export const useAgentCard = ({ endpoint }: { endpoint: string | null | undefined }) =>
  useQuery({
    queryKey: [AGENT_CARD_QUERY_KEY, endpoint],
    queryFn: () => getAgentCard(endpoint ?? ''),
    enabled: !!endpoint,
    staleTime: Infinity,
  })
