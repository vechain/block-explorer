'use client'

import { QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getQueryClient } from './query-client'

export const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient()

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </TanstackQueryClientProvider>
  )
}
