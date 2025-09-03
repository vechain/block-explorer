import type { NextRequest } from 'next/server'
import { i18nRouter } from 'next-i18n-router'
import { i18nConfig } from '@/i18n/config'

export function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  return i18nRouter(request, i18nConfig)
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
}
