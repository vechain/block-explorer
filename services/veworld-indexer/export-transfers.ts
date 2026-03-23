import { ApiError } from '@/lib/api/types'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { INDEXER_HEADERS, resolveUrl } from './index'
import { indexerResponseSchema, indexerTransferSchema, type IndexerTransfer } from './schemas'

const MAX_PAGE_SIZE = 150
const MAX_RETRIES = 5
const INITIAL_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 16000

export type ExportProgress = {
  fetchedCount: number
  lastTimestamp: number
  percentComplete: number
  status: 'fetching' | 'complete' | 'error' | 'cancelled'
  error?: string
}

type ExportTransfersParams = {
  networkName: NetworkName
  address: AddressString
  startDate: Date
  endDate: Date
  onProgress: (progress: ExportProgress) => void
  signal?: AbortSignal
}

/**
 * Fetches all transfers for an account within a date range.
 * Handles pagination automatically and provides progress updates.
 * Implements exponential backoff retry logic for rate limiting.
 */
export async function fetchAllTransfersForExport({
  networkName,
  address,
  startDate,
  endDate,
  onProgress,
  signal,
}: ExportTransfersParams): Promise<IndexerTransfer[]> {
  const allTransfers: IndexerTransfer[] = []
  let page = 0
  let hasNext = true

  // Convert dates to Unix timestamps (seconds) for API params
  const startTimestampSeconds = Math.floor(startDate.getTime() / 1000)
  const endTimestampSeconds = Math.floor(endDate.getTime() / 1000)

  // Keep milliseconds for progress calculation (blockTimestamp is transformed to ms by schema)
  const startTimestampMs = startDate.getTime()
  const endTimestampMs = endDate.getTime()
  const totalTimeRangeMs = endTimestampMs - startTimestampMs

  while (hasNext) {
    // Check for cancellation
    if (signal?.aborted) {
      onProgress({
        fetchedCount: allTransfers.length,
        lastTimestamp:
          allTransfers.length > 0 ? allTransfers[allTransfers.length - 1].blockTimestamp : startTimestampMs,
        percentComplete: 0,
        status: 'cancelled',
      })
      return allTransfers
    }

    try {
      const response = await fetchTransfersPageWithRetry({
        networkName,
        address,
        after: startTimestampSeconds,
        before: endTimestampSeconds,
        page,
        signal,
      })

      allTransfers.push(...response.data)

      hasNext = response.pagination.hasNext
      page++

      // Calculate progress based on the last record's timestamp (blockTimestamp is in milliseconds after schema transform)
      const lastTimestamp =
        response.data.length > 0 ? response.data[response.data.length - 1].blockTimestamp : startTimestampMs

      const percentComplete =
        totalTimeRangeMs > 0
          ? Math.min(100, Math.round(((lastTimestamp - startTimestampMs) / totalTimeRangeMs) * 100))
          : 100

      onProgress({
        fetchedCount: allTransfers.length,
        lastTimestamp,
        percentComplete: hasNext ? percentComplete : 100,
        status: hasNext ? 'fetching' : 'complete',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      onProgress({
        fetchedCount: allTransfers.length,
        lastTimestamp:
          allTransfers.length > 0 ? allTransfers[allTransfers.length - 1].blockTimestamp : startTimestampMs,
        percentComplete: 0,
        status: 'error',
        error: errorMessage,
      })
      throw error
    }
  }

  return allTransfers
}

async function fetchTransfersPageWithRetry({
  networkName,
  address,
  after,
  before,
  page,
  signal,
}: {
  networkName: NetworkName
  address: AddressString
  after: number
  before: number
  page: number
  signal?: AbortSignal
}): Promise<{ data: IndexerTransfer[]; pagination: { hasNext: boolean } }> {
  let retryCount = 0
  let lastError: Error | null = null

  while (retryCount <= MAX_RETRIES) {
    // Check for cancellation before each attempt
    if (signal?.aborted) {
      throw new Error('Export cancelled')
    }

    try {
      // Build params manually to support repeated eventType query params
      const searchParams = new URLSearchParams()
      searchParams.append('address', address)
      searchParams.append('after', String(after))
      searchParams.append('before', String(before))
      searchParams.append('page', String(page))
      searchParams.append('size', String(MAX_PAGE_SIZE))
      searchParams.append('direction', 'ASC')
      searchParams.append('eventType', 'VET')
      searchParams.append('eventType', 'FUNGIBLE_TOKEN')

      const url = `${resolveUrl(networkName)}/transfers?${searchParams.toString()}`
      const response = await fetch(url, { signal, headers: INDEXER_HEADERS })

      if (!response.ok) {
        throw new ApiError({
          message: 'Failed to fetch transfers',
          status: response.status,
          content: await response.text(),
          response,
        })
      }

      const data = await response.json()

      return zodParse({
        data,
        schema: indexerResponseSchema(indexerTransferSchema),
        errorMessage: 'Invalid transfers response from VeWorld Indexer',
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Check if it's a rate limit error (429 or 403)
      const isRateLimitError = error instanceof ApiError && (error.status === 429 || error.status === 403)

      if (isRateLimitError && retryCount < MAX_RETRIES) {
        const delay = Math.min(INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS)
        await sleep(delay, signal)
        retryCount++
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        reject(new Error('Export cancelled'))
      })
    }
  })
}
