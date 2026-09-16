import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry(failureCount, error) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (message.includes('jwt') || message.includes('permission') || message.includes('forbidden')) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export async function clearProtectedQueryCache() {
  await queryClient.cancelQueries();
  queryClient.clear();
}
