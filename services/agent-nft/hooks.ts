import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { parseNftMetadataUri } from '@/services/nft-metadata'
import { type AgentCard, agentCardSchema, type AgentRegistration, agentRegistrationSchema } from './schemas'

const AGENT_REGISTRATION_QUERY_KEY = 'getAgentRegistration'
const AGENT_CARD_QUERY_KEY = 'getAgentCard'

/** Fetch any JSON document through the server-side `/api/nft-metadata` proxy (avoids CORS). */
const fetchJsonViaProxy = async (uri: string): Promise<unknown> => {
  const { data } = await apiClient.get({
    baseUrl: '/api',
    endPoint: '/nft-metadata',
    params: { uri: encodeURIComponent(uri) },
  })
  return data
}

/**
 * Fetch and parse an NFT's `tokenURI` JSON as an agent registration file.
 * Returns `null` for any NFT whose metadata is not an agent registration file,
 * so callers can branch on the result without throwing.
 */
const getAgentRegistration = async (uri: string): Promise<AgentRegistration | null> => {
  const result = agentRegistrationSchema.safeParse(await fetchJsonViaProxy(uri))
  return result.success ? result.data : null
}

export const useAgentRegistration = ({ tokenUri }: { tokenUri: string | null | undefined }) => {
  const parsedUri = tokenUri ? parseNftMetadataUri(tokenUri) : ''

  return useQuery({
    queryKey: [AGENT_REGISTRATION_QUERY_KEY, parsedUri],
    queryFn: () => getAgentRegistration(parsedUri),
    enabled: !!parsedUri,
    staleTime: Infinity,
  })
}

/**
 * Fetch the A2A AgentCard from the registration file's `A2A` service endpoint.
 * Returns `null` when the document does not parse as an AgentCard.
 */
const getAgentCard = async (endpoint: string): Promise<AgentCard | null> => {
  const result = agentCardSchema.safeParse(await fetchJsonViaProxy(endpoint))
  return result.success ? result.data : null
}

export const useAgentCard = ({ endpoint }: { endpoint: string | null | undefined }) => {
  const parsedEndpoint = endpoint ? parseNftMetadataUri(endpoint) : ''

  return useQuery({
    queryKey: [AGENT_CARD_QUERY_KEY, parsedEndpoint],
    queryFn: () => getAgentCard(parsedEndpoint),
    enabled: !!parsedEndpoint,
    staleTime: Infinity,
  })
}
