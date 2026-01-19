import { NextResponse, type NextRequest } from 'next/server'
import { i18nRouter } from 'next-i18n-router'
import { i18nConfig } from '@/i18n/config'
import { currencyConfig } from '@/lib/constants/currency-config'

export function middleware(request: NextRequest) {
  // First, let i18nRouter handle locale routing
  const i18nResponse = i18nRouter(request, i18nConfig)

  // Handle currency from URL params or cookies
  const { searchParams } = request.nextUrl
  const urlCurrency = searchParams.get('currency')?.toLowerCase()
  const cookieCurrency = request.cookies.get(currencyConfig.cookieName)?.value

  // Validate if currency is valid
  const isValidCurrency = (value: string | undefined): boolean =>
    value !== undefined && currencyConfig.currencies.includes(value as (typeof currencyConfig.currencies)[number])

  // Determine the active currency
  let activeCurrency: string | undefined
  if (isValidCurrency(urlCurrency)) {
    activeCurrency = urlCurrency
  } else if (isValidCurrency(cookieCurrency)) {
    activeCurrency = cookieCurrency
  } else {
    activeCurrency = currencyConfig.defaultCurrency
  }

  // If currency was provided in URL, update the cookie
  if (isValidCurrency(urlCurrency) && urlCurrency !== cookieCurrency) {
    // Create a new response if we need to set a cookie
    const response = i18nResponse || NextResponse.next()
    response.cookies.set(currencyConfig.cookieName, urlCurrency!, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
    return response
  }

  // If no currency in URL but we have one in cookie, add it to search params
  // This ensures SSR prefetching uses the correct currency
  if (!urlCurrency && activeCurrency && activeCurrency !== currencyConfig.defaultCurrency) {
    const url = request.nextUrl.clone()
    url.searchParams.set('currency', activeCurrency)
    const response = NextResponse.redirect(url)
    return response
  }

  return i18nResponse
}

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
}
