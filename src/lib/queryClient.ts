import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import {
  logReactQueryMutationError,
  logReactQueryMutationStart,
  logReactQueryMutationSuccess,
  logReactQueryQueryError,
} from "./logger";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      logReactQueryMutationError(mutation, error);
    },
    onMutate: (_variables, mutation) => {
      logReactQueryMutationStart(mutation);
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      logReactQueryMutationSuccess(mutation);
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query) => {
      logReactQueryQueryError(query, error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});
