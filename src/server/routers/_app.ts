import { router } from '../trpc';
import { authRouter } from './auth';
import { tenantRouter } from './tenant';
import { userRouter } from './user';
import { memberRouter } from './member';
import { tierRouter } from './tier';
import { productRouter } from './product';
import { paymentRouter } from './payment';
import { postRouter } from './post';
import { eventRouter } from './event';
import { taskRouter } from './task';
import { communicationRouter } from './communication';
import { workflowRouter } from './workflow';
import { aiRouter } from './ai';
import { analyticsRouter } from './analytics';
import { searchRouter } from './search';
import { webhookRouter } from './webhook';
import { settingsRouter } from './settings';

export const appRouter = router({
  auth: authRouter,
  tenant: tenantRouter,
  user: userRouter,
  member: memberRouter,
  tier: tierRouter,
  product: productRouter,
  payment: paymentRouter,
  post: postRouter,
  event: eventRouter,
  task: taskRouter,
  communication: communicationRouter,
  workflow: workflowRouter,
  ai: aiRouter,
  analytics: analyticsRouter,
  search: searchRouter,
  webhook: webhookRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
export default appRouter;
