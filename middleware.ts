import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { i18nRouter } from 'next-i18n-router'
import { i18nConfig } from '@/i18n/config'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.includes('/accounts/')) {
    const newPath = pathname.replace('/accounts/', '/address/')
    return NextResponse.redirect(new URL(newPath, request.url), 308)
  }
  if (pathname.includes('/account/')) {
    const newPath = pathname.replace('/account/', '/address/')
    return NextResponse.redirect(new URL(newPath, request.url), 308)
  }
  if (pathname.includes('/addresses/')) {
    const newPath = pathname.replace('/addresses/', '/address/')
    return NextResponse.redirect(new URL(newPath, request.url), 308)
  }
  return i18nRouter(request, i18nConfig)
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
}
