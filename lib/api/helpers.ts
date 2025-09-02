import { NextResponse } from 'next/server'
import { ApiError } from './types'

export function createErrorResponse({ status, ...rest }: Omit<ApiError, 'name'>): NextResponse<ApiError> {
  const error = new ApiError({ status, ...rest })

  return NextResponse.json(error, { status: error.status })
}
