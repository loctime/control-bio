'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto - los datos se consideran frescos
            gcTime: 5 * 60 * 1000, // 5 minutos - tiempo de caché (antes cacheTime)
            refetchOnWindowFocus: false, // No recargar al cambiar de tab
            retry: 1, // Reintentar una vez si falla
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

