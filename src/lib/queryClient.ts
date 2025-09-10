import { QueryClient } from '@tanstack/react-query';

// Créer une instance unique du QueryClient avec une configuration optimisée
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Ne pas retry sur les erreurs 404 ou d'authentification
        if (error?.status === 404 || error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (remplace cacheTime)
    },
    mutations: {
      retry: false,
    },
  },
});