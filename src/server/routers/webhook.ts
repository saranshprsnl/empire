import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const webhookRouter = router({
  ping: publicProcedure.query(() => {
    return { status: 'healthy', timestamp: new Date() };
  }),
});
