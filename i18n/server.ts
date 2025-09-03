import { headers } from 'next/headers'
import i18nInit from '.'
import type { Locale } from './config'

export async function i18n() {
  const headersList = await headers()
  const locale = headersList.get('x-next-i18n-router-locale') as Locale | null

  return i18nInit({ locale })
}
