import { router, protectedProcedure } from '../trpc';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Meilisearch } from 'meilisearch';

const meiliHost = process.env.MEILI_HOST || 'http://localhost:7700';
const meiliKey = process.env.MEILI_MASTER_KEY || 'masterKey';

let meiliClient: Meilisearch | null = null;
try {
  meiliClient = new Meilisearch({ host: meiliHost, apiKey: meiliKey });
} catch {
  // Graceful fallback if meilisearch instance isn't running locally yet
}

export const searchRouter = router({
  global: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      if (meiliClient) {
        try {
          const index = meiliClient.index('members');
          const results = await index.search(input.query, { limit: 10 });
          return {
            source: 'meilisearch',
            members: results.hits,
          };
        } catch {
          // Fall back to database query
        }
      }

      // Database fallback
      const members = await prisma.member.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { email: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      return {
        source: 'database',
        members,
      };
    }),
});
