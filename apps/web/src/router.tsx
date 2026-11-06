import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { queryClient } from '@/lib/query-client';
import { NotFound } from '@/components/not-found';
import { RouteError } from '@/components/route-error';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultNotFoundComponent: NotFound,
  defaultErrorComponent: RouteError,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
