import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 menit — data dianggap fresh
      retry: 1,                    // retry sekali kalau gagal
      refetchOnWindowFocus: false  // tidak refetch tiap fokus window
    }
  }
})