import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

// Global query cache with error logging
const queryCache = new QueryCache({
  onError: (error) => {
    console.error("Query Error:", error);

    // Log additional context if available
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  },
});

// Global mutation cache with error logging
const mutationCache = new MutationCache({
  onError: (error) => {
    console.error("Mutation Error:", error);

    // Log additional context if available
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
