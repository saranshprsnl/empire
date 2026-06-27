import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/routers/_app';

/**
 * React hooks wrapper for client-side queries and mutations.
 */
export const trpc = createTRPCReact<AppRouter>();
export default trpc;
