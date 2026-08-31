'use client'

import { useTranslation } from 'react-i18next'
import { NotFound } from '@/components/error/NotFound'
import { useRouteSegments } from '@/hooks/useRouteSegments'
import { addressStringSchema } from '@/lib/schemas'
import { AddressPageContent } from './AddressPageContent'

export function AddressRoute() {
  const { t } = useTranslation()
  const [, addressParam] = useRouteSegments()
  const address = addressStringSchema.safeParse(addressParam)

  if (!address.success) return <NotFound title={t('The address you are looking for does not exist')} />

  return <AddressPageContent address={address.data} />
}
