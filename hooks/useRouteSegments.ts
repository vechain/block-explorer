'use client'

import { usePathname } from 'next/navigation'
import { getRouteSegments } from '@/lib/utils/route-path'

// The static shell is built with a sentinel param, so the real segment is only in the browser URL.
export const useRouteSegments = (): string[] => getRouteSegments(usePathname())
