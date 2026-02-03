import type { QueryClient } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { erc20ContractQueryOptions } from '@/services/thor/tokens/erc20'
import { erc721ContractQueryOptions } from '@/services/thor/tokens/erc721'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'
import { NATIVE_TOKEN_DECIMALS } from '@/lib/constants/tokens'

const CSV_HEADERS = ['Txid', 'Block# ', 'Date(GMT)', 'Sender', 'Recipient', 'Amount', 'Token', 'Remark']

type TokenInfo = {
  symbol: string
  decimals: number
}

type TokenCache = Map<string, TokenInfo>

/**
 * Generates a CSV file from transfer data and triggers download.
 */
export async function generateAndDownloadTransfersCsv({
  transfers,
  accountAddress,
  networkName,
  queryClient,
  filename,
}: {
  transfers: IndexerTransfer[]
  accountAddress: AddressString
  networkName: NetworkName
  queryClient: QueryClient
  filename: string
}): Promise<void> {
  // Build token cache for all unique token addresses
  const tokenCache = await buildTokenCache(transfers, networkName, queryClient)

  // Generate CSV rows
  const rows = transfers.map(transfer => transferToCsvRow(transfer, accountAddress, tokenCache))

  // Create CSV content
  const csvContent = [CSV_HEADERS.join(','), ...rows.map(row => row.join(','))].join('\n')

  // Trigger download
  downloadCsv(csvContent, filename)
}

/**
 * Builds a cache of token info (symbol, decimals) for all unique token addresses.
 * Uses TanStack Query cache to avoid redundant fetches.
 */
async function buildTokenCache(
  transfers: IndexerTransfer[],
  networkName: NetworkName,
  queryClient: QueryClient,
): Promise<TokenCache> {
  const cache: TokenCache = new Map()

  // Add VET to cache
  cache.set('VET', { symbol: 'VET', decimals: NATIVE_TOKEN_DECIMALS })

  // Collect unique token addresses by event type
  const fungibleAddresses = new Set<AddressString>()
  const nftAddresses = new Set<AddressString>()

  for (const transfer of transfers) {
    if (transfer.tokenAddress) {
      if (transfer.eventType === 'FUNGIBLE_TOKEN') {
        fungibleAddresses.add(transfer.tokenAddress)
      } else if (transfer.eventType === 'NFT') {
        nftAddresses.add(transfer.tokenAddress)
      }
    }
  }

  // Fetch ERC20 token info
  // Note: fetchQuery doesn't apply the `select` function, so we get the raw Erc20 | null result
  const erc20Promises = Array.from(fungibleAddresses).map(async address => {
    try {
      const { queryKey, queryFn } = erc20ContractQueryOptions(networkName, address)
      const result = await queryClient.fetchQuery({ queryKey, queryFn })
      if (result) {
        cache.set(address, {
          symbol: result.symbol,
          decimals: result.decimals,
        })
      }
    } catch {
      // If fetch fails, we'll use fallback values
      cache.set(address, { symbol: truncateAddress(address), decimals: NATIVE_TOKEN_DECIMALS })
    }
  })

  // Fetch ERC721 token info
  // Note: fetchQuery doesn't apply the `select` function, so we get the raw Erc721 | null result
  const erc721Promises = Array.from(nftAddresses).map(async address => {
    try {
      const { queryKey, queryFn } = erc721ContractQueryOptions(networkName, address)
      const result = await queryClient.fetchQuery({ queryKey, queryFn })
      if (result) {
        cache.set(address, {
          symbol: result.name || result.symbol,
          decimals: 0, // NFTs don't have decimals
        })
      }
    } catch {
      // If fetch fails, we'll use fallback values
      cache.set(address, { symbol: 'NFT', decimals: 0 })
    }
  })

  await Promise.all([...erc20Promises, ...erc721Promises])

  return cache
}

/**
 * Converts a single transfer to a CSV row.
 */
function transferToCsvRow(transfer: IndexerTransfer, accountAddress: AddressString, tokenCache: TokenCache): string[] {
  const isOutgoing = transfer.from.toLowerCase() === accountAddress.toLowerCase()
  const isIncoming = transfer.to.toLowerCase() === accountAddress.toLowerCase()
  const isSelfTransfer = isOutgoing && isIncoming

  // Get token info
  let tokenInfo: TokenInfo
  if (transfer.eventType === 'VET') {
    tokenInfo = tokenCache.get('VET')!
  } else if (transfer.tokenAddress) {
    tokenInfo = tokenCache.get(transfer.tokenAddress) || { symbol: 'Unknown', decimals: NATIVE_TOKEN_DECIMALS }
  } else {
    tokenInfo = { symbol: 'Unknown', decimals: NATIVE_TOKEN_DECIMALS }
  }

  // Calculate amount with sign
  const rawAmount = formatBigIntToDecimal(transfer.value, tokenInfo.decimals)
  const amount = isOutgoing && !isSelfTransfer ? `-${rawAmount}` : rawAmount

  // Generate remark
  const remark = generateRemark(transfer, isSelfTransfer, isOutgoing, rawAmount, tokenInfo.symbol)

  return [
    transfer.txId,
    transfer.blockNumber.toString(),
    formatTimestamp(transfer.blockTimestamp),
    transfer.from,
    transfer.to,
    amount,
    tokenInfo.symbol,
    remark,
  ]
}

/**
 * Formats a timestamp (milliseconds) to YYYY-MM-DD HH:mm:ss format.
 * Note: blockTimestamp is already in milliseconds after schema transformation.
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Formats a bigint value to a decimal string with the given decimals.
 */
function formatBigIntToDecimal(value: bigint, decimals: number): string {
  if (decimals === 0) return value.toString()

  const str = value.toString().padStart(decimals + 1, '0')
  const integerPart = str.slice(0, -decimals) || '0'
  const decimalPart = str.slice(-decimals)

  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimalPart.replace(/0+$/, '')

  if (trimmedDecimal === '') {
    return integerPart
  }

  return `${integerPart}.${trimmedDecimal}`
}

/**
 * Generates a remark for the transfer.
 */
function generateRemark(
  transfer: IndexerTransfer,
  isSelfTransfer: boolean,
  isOutgoing: boolean,
  amount: string,
  symbol: string,
): string {
  if (transfer.eventType === 'NFT') {
    const tokenId = transfer.tokenId || 'unknown'
    if (isSelfTransfer) {
      return `self-transferred ${symbol} #${tokenId}`
    }
    return isOutgoing ? `sent ${symbol} #${tokenId}` : `received ${symbol} #${tokenId}`
  }

  if (isSelfTransfer) {
    return `self-transferred ${amount} ${symbol}`
  }

  return isOutgoing ? `sent ${amount} ${symbol}` : `received ${amount} ${symbol}`
}

/**
 * Truncates an address to a shorter format for display.
 */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Triggers a CSV file download in the browser.
 */
function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generates a filename for the CSV export.
 */
export function generateExportFilename(address: AddressString, startDate: Date, endDate: Date): string {
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  return `transfers_${address}_${formatDate(startDate)}_to_${formatDate(endDate)}.csv`
}
