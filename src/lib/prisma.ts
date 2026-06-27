import { PrismaClient } from '@prisma/client';
import { getTenantId } from './tenant-context';
import './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;

// Lowercase model names that require automated tenantId filtering
const tenantScopedModels = new Set([
  'user',
  'member',
  'tier',
  'product',
  'payment',
  'invoice',
  'post',
  'event',
  'eventrsvp',
  'course',
  'module',
  'lesson',
  'courseprogress',
  'message',
  'memberactivity',
  'task',
  'workflow',
  'aiinsight',
  'analyticsevent',
  'activitylog',
  'tenantsettings',
]);

/**
 * Extended Prisma Client that automatically filters queries by the active tenantId,
 * preventing cross-tenant data leaks and insecure direct object reference (IDOR).
 */
export const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations(params: { model: any; operation: any; args: any; query: any; }) {
        const { model, operation, args, query } = params;
        const tenantId = getTenantId();
        const modelNameLower = model.toLowerCase();

        // Check if tenant context exists and the model is scoped to a tenant
        if (tenantId && tenantScopedModels.has(modelNameLower)) {
          const anyArgs = args as any;
          anyArgs.where = anyArgs.where || {};

          // Convert findUnique to findFirst to allow filtering by non-unique fields
          if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
            const nextOp = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
            anyArgs.where.tenantId = tenantId;
            return (prismaClient[model as any] as any)[nextOp](anyArgs);
          }

          // Safety check: prevent explicit query mismatches
          if (anyArgs.where.tenantId && anyArgs.where.tenantId !== tenantId) {
            throw new Error(
              `Security Exception: Tenant mismatch. Attempted to access tenant ${anyArgs.where.tenantId} from context ${tenantId}`
            );
          }

          // Automatically inject tenantId filter
          anyArgs.where.tenantId = tenantId;
        }

        return query(args);
      },
    },
  },
});

export default prisma;
