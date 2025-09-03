import type { ApiResponse } from './types'
import { ApiError } from './types'

export const get = async <T>({
  baseUrl,
  endPoint,
  params,
  method = 'GET',
  headers = {},
  timeout = 10 * 1000,
}: {
  baseUrl: string
  endPoint: string
  params?: Record<string, string>
  timeout?: number
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
}): Promise<ApiResponse<T>> => {
  try {
    // Build URL safely
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    const url = [baseUrl, endPoint, queryString].join('')

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle error response
    if (!response.ok) {
      throw new ApiError({
        message: 'Fail to fetch data',
        status: response.status,
        content: await response.text(),
        response,
      })
    }

    // Try to parse JSON, handle parsing errors
    try {
      const data = await response.json()
      return { data, status: response.status }
    } catch (parseError) {
      throw new ApiError({
        message: 'Response could not be parsed as JSON',
        status: response.status,
        cause: parseError instanceof Error ? parseError : undefined,
        response,
      })
    }
  } catch (error) {
    // Handle other errors
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError({
          message: `Request timed out after ${timeout}ms`,
          status: 408,
          cause: error,
        })
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError({
          message: 'Failed to connect to the server',
          status: 0,
          cause: error,
        })
      }
    }

    throw new ApiError({
      message: '💥 Unexpected error in API client',
      status: 500,
      cause: error instanceof Error ? error : undefined,
    })
  }
}
