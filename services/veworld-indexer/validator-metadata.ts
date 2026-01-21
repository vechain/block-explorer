import { z } from 'zod'
import { type NetworkName, NetworkName as NetworkNameEnum } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import type { ValidatorMetadata } from './validator-details'

const VALIDATOR_HUB_BASE_URL = 'https://vechain.github.io/validator-hub'

// Map block-explorer network names to validator-hub network IDs
// Block-explorer uses 'mainnet'/'testnet', validator-hub uses 'main'/'test'
const networkNameToValidatorHubId = (networkName: NetworkName): string => {
  switch (networkName) {
    case NetworkNameEnum.MAINNET:
      return 'main'
    case NetworkNameEnum.TESTNET:
      return 'test'
    default:
      return networkName
  }
}

// Schema for validator metadata from GitHub
const validatorMetadataSchema = z.object({
  address: z.string(),
  name: z.string(),
  location: z.string(),
  desc: z.string(),
  website: z.string().optional(),
  logo: z.string(),
})

const validatorMetadataArraySchema = z.array(validatorMetadataSchema)

/**
 * Fetch all validators metadata from GitHub validator-hub
 */
const getValidatorsMetadata = async ({ networkName }: { networkName: NetworkName }): Promise<ValidatorMetadata[]> => {
  const validatorHubNetworkId = networkNameToValidatorHubId(networkName)
  const url = `${VALIDATOR_HUB_BASE_URL}/${validatorHubNetworkId}.json`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    console.warn('Failed to fetch validators metadata from validator-hub')
    return []
  }

  const data = await response.json()

  const parsed = zodParse({
    data,
    schema: validatorMetadataArraySchema,
    errorMessage: 'Invalid validators metadata response from validator-hub',
  })

  // Transform logo paths to full URLs
  return parsed.map(meta => ({
    ...meta,
    logo: `${VALIDATOR_HUB_BASE_URL}/${meta.logo}`,
  }))
}

/**
 * Get metadata for a specific validator address
 */
const getValidatorMetadata = async ({
  networkName,
  validatorAddress,
}: {
  networkName: NetworkName
  validatorAddress: string
}): Promise<ValidatorMetadata | null> => {
  const allMetadata = await getValidatorsMetadata({ networkName })

  const metadata = allMetadata.find(meta => meta.address.toLowerCase() === validatorAddress.toLowerCase())

  return metadata ?? null
}

// Query options for single validator metadata
export const validatorMetadataQueryOptions = (networkName: NetworkName, address: string | undefined) => ({
  queryKey: ['validatorMetadata', networkName, address],
  queryFn: () => getValidatorMetadata({ networkName, validatorAddress: address! }),
  enabled: !!address,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 60000,
})
