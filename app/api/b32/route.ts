import { type NextRequest, NextResponse } from 'next/server'
import type { Abi } from 'viem'
import { B32_URL } from '@/env.api'
import { apiClient, createErrorResponse } from '@/lib/api/index'
import { ApiError } from '@/lib/api/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const signature = searchParams.get('signature')

    // Input validation
    if (!signature) {
      return createErrorResponse({ status: 400, message: 'Signature parameter is required' })
    }

    if (signature.trim().length === 0) {
      return createErrorResponse({ status: 400, message: 'Signature parameter cannot be empty' })
    }

    // API call
    const response = await apiClient.get<Abi>({
      baseUrl: B32_URL,
      endPoint: `/q/${signature}.json`,
    })

    // Success response
    return NextResponse.json(response.data)
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Error in b32 route', error.response)
      return createErrorResponse(error)
    }

    // Handle unexpected errors
    console.error('Unexpected error in b32 route:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      signature: request.nextUrl.searchParams.get('signature'),
    })

    return createErrorResponse({ status: 500, message: 'An unexpected error occurred' })
  }
}
