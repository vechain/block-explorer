import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import type { IndexerTransfer } from '@/services/veworld-indexer/schemas'
import { NATIVE_TOKEN_DECIMALS } from '@/lib/constants/tokens'
import { getTokenInfo } from '@/lib/constants/token-registry'

const CSV_HEADERS = ['Txid', 'Block# ', 'Date(GMT)', 'Sender', 'Recipient', 'Amount', 'Token', 'Remark']

type TokenInfo = {
  symbol: string
  decimals: number
}

type TokenCache = Map<string, TokenInfo>

/**
 * Generates a CSV file from transfer data and triggers download.
 * Only includes transfers for tokens that are in the official vechain token registry.
 * NFTs and unlisted tokens are excluded.
 */
export function generateAndDownloadTransfersCsv({
  transfers,
  accountAddress,
  networkName,
  filename,
}: {
  transfers: IndexerTransfer[]
  accountAddress: AddressString
  networkName: NetworkName
  filename: string
}): void {
  // Build token cache for all unique token addresses
  const tokenCache = buildTokenCache(transfers, networkName)

  // Filter transfers to only include those with tokens in the cache
  // This excludes NFTs and unlisted fungible tokens
  const includedTransfers = transfers.filter(transfer => {
    if (transfer.eventType === 'VET') {
      return true // VET is always included
    }
    if (transfer.eventType === 'NFT') {
      return false // NFTs are excluded
    }
    if (transfer.tokenAddress) {
      return tokenCache.has(transfer.tokenAddress)
    }
    return false
  })

  // Generate CSV rows
  const rows = includedTransfers.map(transfer => transferToCsvRow(transfer, accountAddress, tokenCache))

  // Create CSV content with proper field escaping
  const csvContent = [
    CSV_HEADERS.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(',')),
  ].join('\n')

  // Trigger download
  downloadCsv(csvContent, filename)
}

/**
 * Builds a cache of token info (symbol, decimals) for all unique token addresses.
 * Uses the local token registry instead of contract calls.
 * Only tokens in the official vechain token registry are included.
 */
function buildTokenCache(transfers: IndexerTransfer[], networkName: NetworkName): TokenCache {
  const cache: TokenCache = new Map()

  // Add VET to cache
  cache.set('VET', { symbol: 'VET', decimals: NATIVE_TOKEN_DECIMALS })

  // Collect unique fungible token addresses
  const fungibleAddresses = new Set<AddressString>()

  for (const transfer of transfers) {
    if (transfer.tokenAddress && transfer.eventType === 'FUNGIBLE_TOKEN') {
      fungibleAddresses.add(transfer.tokenAddress)
    }
  }

  // Look up token info from the registry
  for (const address of fungibleAddresses) {
    const tokenInfo = getTokenInfo(networkName, address)
    if (tokenInfo) {
      cache.set(address, tokenInfo)
    }
    // Tokens not in registry are not added to cache and will be filtered out
  }

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
  // Self-transfers have a net amount of 0 since the same account sends and receives
  const rawAmount = formatBigIntToDecimal(transfer.value, tokenInfo.decimals)
  const amount = isSelfTransfer ? '0' : isOutgoing ? `-${rawAmount}` : rawAmount

  // Generate remark
  const remark = generateRemark(isSelfTransfer, isOutgoing, rawAmount, tokenInfo.symbol)

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
 * NFTs are excluded from export, so this only handles VET and fungible tokens.
 */
function generateRemark(isSelfTransfer: boolean, isOutgoing: boolean, amount: string, symbol: string): string {
  if (isSelfTransfer) {
    return `self-transferred ${amount} ${symbol}`
  }

  return isOutgoing ? `sent ${amount} ${symbol}` : `received ${amount} ${symbol}`
}

/**
 * Escapes a CSV field value according to RFC 4180.
 * Fields containing commas, newlines, or double quotes are wrapped in double quotes.
 * Internal double quotes are escaped by doubling them.
 */
function escapeCsvField(value: string): string {
  // Check if the field needs to be quoted
  const needsQuoting = value.includes(',') || value.includes('\n') || value.includes('\r') || value.includes('"')

  if (!needsQuoting) {
    return value
  }

  // Escape internal double quotes by doubling them
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
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
