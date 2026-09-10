'use client'

import type { TFunction } from 'i18next'
import { toaster } from '@/components/ui/toaster'
import type { NetworkName } from '@/lib/constants/network'
import { getNetworkLabel } from '@/lib/utils/network-label'

export const showAutomaticNetworkSwitchToast = ({
  t,
  fromNetworkName,
  toNetworkName,
}: {
  t: TFunction
  fromNetworkName: NetworkName
  toNetworkName: NetworkName
}) => {
  if (fromNetworkName === toNetworkName) return

  queueMicrotask(() => {
    toaster.create({
      type: 'warning',
      closable: true,
      title: t('Network switched automatically'),
      description: t('The requested data was found on {{to}}. The explorer switched from {{from}} to {{to}}.', {
        from: getNetworkLabel(t, fromNetworkName),
        to: getNetworkLabel(t, toNetworkName),
      }),
    })
  })
}
