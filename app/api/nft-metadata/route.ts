import { type NextRequest, NextResponse } from 'next/server'
import { apiClient, createErrorResponse } from '@/lib/api/index'
import { ApiError } from '@/lib/api/types'
import type { NftMetadata } from '@/services/nft-metadata'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let uri = searchParams.get('uri')

    // Input validation
    if (!uri || uri.trim().length === 0) {
      return createErrorResponse({ status: 400, message: 'URI parameter is required' })
    }

    uri = decodeURIComponent(uri)

    // API call
    const response = await apiClient.get<NftMetadata>({
      baseUrl: uri,
      endPoint: `/`,
    })

    // Success response
    return NextResponse.json(response.data)
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Error in nft-metadata route', error.response)
      return createErrorResponse(error)
    }

    // Handle unexpected errors
    console.error('Unexpected error in arweave route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      uri: request.nextUrl.searchParams.get('uri'),
    })

    return createErrorResponse({ status: 500, message: 'An unexpected error occurred' })
  }
}
