import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// SPA mode: single QueryClient for the browser session.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

export const getRouter = () =>
  createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
