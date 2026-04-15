import { useMutation } from '@tanstack/react-query'
import type { Network, NetworkName } from '@/lib/constants/network'
import { getTokenByNameOrSymbol } from '@/lib/constants/token-registry'
import {
  addressStringSchema,
  blockRevisionSchema,
  type BlockRevision,
  type TransactionId,
  transactionIdSchema,
} from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getFallbackNetworkName } from '@/lib/utils/network'
import { getAccount } from '@/services/thor/account'
import { getBlockCompressed } from '@/services/thor/block'
import { getTransaction } from '@/services/thor/transaction'
import { getVnsAddress } from '@/services/thor/vns'

export enum SearchTermType {
  ADDRESS = 'ADDRESS',
  BLOCK_REVISION = 'BLOCK_REVISION',
  TRANSACTION_ID = 'TRANSACTION_ID',
  VNS_DOMAIN = 'VNS_DOMAIN',
  UNKNOWN = 'UNKNOWN',
}

export const normalizeSearchTerm = (searchTerm: string): string => {
  // Trim whitespace and convert to lowercase for keyword matching
  const trimmed = searchTerm.trim()

  // Handle British spelling variations for block revision keywords
  const normalized = trimmed.toLowerCase()
  if (normalized === 'finalised') {
    return 'finalized'
  }

  // For other keywords, return lowercase
  if (['best', 'next', 'finalized', 'justified'].includes(normalized)) {
    return normalized
  }

  // For hex strings and addresses, preserve original case after trimming
  return trimmed
}

export const identifySearchTermType = (searchTerm: string): SearchTermType => {
  const normalizedTerm = normalizeSearchTerm(searchTerm)

  // Check for VNS domain first (most specific)
  if (normalizedTerm.endsWith('.vet')) {
    return SearchTermType.VNS_DOMAIN
  }

  // Check for address (40 hex characters with or without 0x prefix)
  const addressResult = addressStringSchema.safeParse(normalizedTerm)
  if (addressResult.success) {
    return SearchTermType.ADDRESS
  }

  // Check for address without 0x prefix
  if (/^[a-fA-F0-9]{40}$/.test(normalizedTerm)) {
    return SearchTermType.ADDRESS
  }

  // Check for transaction ID (64 hex characters with or without 0x prefix)
  const transactionResult = transactionIdSchema.safeParse(normalizedTerm)
  if (transactionResult.success) {
    return SearchTermType.TRANSACTION_ID
  }

  // Check for transaction ID without 0x prefix
  if (/^[a-fA-F0-9]{64}$/.test(normalizedTerm)) {
    return SearchTermType.TRANSACTION_ID
  }

  // Check for block revision (numbers, hex IDs, or keywords like "best", "next", etc.)
  const blockRevisionResult = blockRevisionSchema.safeParse(normalizedTerm)
  if (blockRevisionResult.success) {
    return SearchTermType.BLOCK_REVISION
  }

  return SearchTermType.UNKNOWN
}

const attemptVnsResolution = async (searchTerm: string, activeNetwork: Network, errorMessage: string) => {
  const address = await getVnsAddress({
    networkName: activeNetwork.name,
    name: searchTerm,
  })
  if (address) {
    return { redirectTo: `/address/${address}` }
  }

  throw new Error(errorMessage)
}

const getRedirectTo = ({
  pathname,
  activeNetworkName,
  targetNetworkName,
}: {
  pathname: string
  activeNetworkName: NetworkName
  targetNetworkName: NetworkName
}) => {
  if (activeNetworkName === targetNetworkName) return pathname

  return `${pathname}?network=${targetNetworkName}`
}

const tryGetBlockCompressed = async ({
  networkName,
  revision,
}: {
  networkName: NetworkName
  revision: BlockRevision
}) => {
  try {
    return await getBlockCompressed({ networkName, revision })
  } catch {
    return null
  }
}

const findBlockRedirect = async ({ activeNetwork, revision }: { activeNetwork: Network; revision: BlockRevision }) => {
  const block = await tryGetBlockCompressed({
    networkName: activeNetwork.name,
    revision,
  })

  if (block) {
    return {
      redirectTo: getRedirectTo({
        pathname: `/block/${block.id}`,
        activeNetworkName: activeNetwork.name,
        targetNetworkName: activeNetwork.name,
      }),
    }
  }

  const fallbackNetworkName = getFallbackNetworkName(activeNetwork.name)
  if (!fallbackNetworkName) return null

  const fallbackBlock = await tryGetBlockCompressed({
    networkName: fallbackNetworkName,
    revision,
  })

  if (!fallbackBlock) return null

  return {
    redirectTo: getRedirectTo({
      pathname: `/block/${fallbackBlock.id}`,
      activeNetworkName: activeNetwork.name,
      targetNetworkName: fallbackNetworkName,
    }),
  }
}

const findTransactionRedirect = async ({
  activeNetwork,
  transactionId,
}: {
  activeNetwork: Network
  transactionId: TransactionId
}) => {
  const transaction = await getTransaction({
    networkName: activeNetwork.name,
    transactionId,
  })

  if (transaction) {
    return {
      redirectTo: getRedirectTo({
        pathname: `/transactions/${transaction.id}`,
        activeNetworkName: activeNetwork.name,
        targetNetworkName: activeNetwork.name,
      }),
    }
  }

  const fallbackNetworkName = getFallbackNetworkName(activeNetwork.name)
  if (!fallbackNetworkName) return null

  const fallbackTransaction = await getTransaction({
    networkName: fallbackNetworkName,
    transactionId,
  })

  if (!fallbackTransaction) return null

  return {
    redirectTo: getRedirectTo({
      pathname: `/transactions/${fallbackTransaction.id}`,
      activeNetworkName: activeNetwork.name,
      targetNetworkName: fallbackNetworkName,
    }),
  }
}

const searchHandlers = {
  [SearchTermType.ADDRESS]: async (searchTerm: string, activeNetwork: Network) => {
    // Add 0x prefix if missing
    const normalizedAddress = searchTerm.startsWith('0x') ? searchTerm : `0x${searchTerm}`
    const parsedAddress = addressStringSchema.parse(normalizedAddress)
    const account = await getAccount({
      networkName: activeNetwork.name,
      address: parsedAddress,
    })
    if (account) {
      return { redirectTo: `/address/${account.address}` }
    }
    throw new Error('Address not found')
  },

  [SearchTermType.BLOCK_REVISION]: async (searchTerm: string, activeNetwork: Network) => {
    const parsedRevision = blockRevisionSchema.parse(searchTerm)
    const blockRedirect = await findBlockRedirect({
      activeNetwork,
      revision: parsedRevision,
    })

    if (blockRedirect) return blockRedirect

    throw new Error('Block not found')
  },

  [SearchTermType.TRANSACTION_ID]: async (searchTerm: string, activeNetwork: Network) => {
    // Add 0x prefix if missing
    const normalizedHex = searchTerm.startsWith('0x') ? searchTerm : `0x${searchTerm}`

    // Try transaction first
    try {
      const parsedHex = transactionIdSchema.parse(normalizedHex)
      const transactionRedirect = await findTransactionRedirect({
        activeNetwork,
        transactionId: parsedHex,
      })

      if (transactionRedirect) return transactionRedirect
    } catch {
      // If transaction parsing/lookup throws, fall through to block lookup
    }

    // If transaction lookup failed or returned null, try as block ID
    try {
      const parsedRevision = blockRevisionSchema.parse(normalizedHex)
      const blockRedirect = await findBlockRedirect({
        activeNetwork,
        revision: parsedRevision,
      })

      if (blockRedirect) return blockRedirect
    } catch {
      // Block lookup failed
    }

    throw new Error('Transaction or block not found')
  },

  [SearchTermType.VNS_DOMAIN]: async (searchTerm: string, activeNetwork: Network) => {
    return attemptVnsResolution(searchTerm, activeNetwork, 'VNS domain not found')
  },

  [SearchTermType.UNKNOWN]: async (searchTerm: string, activeNetwork: Network) => {
    // Check if it matches a known token name or symbol
    const token = getTokenByNameOrSymbol(activeNetwork.name, searchTerm)
    if (token) {
      return { redirectTo: `/address/${token.address}` }
    }

    // Fall back to VNS resolution
    return attemptVnsResolution(searchTerm, activeNetwork, 'No results found')
  },
}

export const useSearch = () => {
  const { activeNetwork } = useSettingsStore()

  return useMutation({
    mutationFn: (searchTerm: string) => search({ searchTerm, activeNetwork }),
  })
}

export const search = async ({
  searchTerm,
  activeNetwork,
}: {
  searchTerm: string
  activeNetwork: Network
}): Promise<{ redirectTo: string }> => {
  const normalizedTerm = normalizeSearchTerm(searchTerm)
  const searchType = identifySearchTermType(normalizedTerm)
  const handler = searchHandlers[searchType]
  return handler(normalizedTerm, activeNetwork)
}
