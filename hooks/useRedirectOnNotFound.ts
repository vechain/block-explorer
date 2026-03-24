import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export const useRedirectOnNotFound = ({ isNotFound }: { isNotFound: boolean }): boolean => {
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (isNotFound && !hasRedirected.current) {
      hasRedirected.current = true
      router.replace('/')
    }
  }, [isNotFound, router])

  return isNotFound
}
