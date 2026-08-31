'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getLocalePrefix } from '@/lib/utils/route-path'

// The locale is carried over explicitly rather than left to middleware, which a static export
// will not have.
export const LegacyTransfersRedirect = ({ type }: { type: 'nft' | 'token' }) => {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    router.replace(`${getLocalePrefix(pathname)}/transfers?type=${type}`)
  }, [pathname, router, type])

  return null
}
