import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

/**
 * Gets the active tenantId from the current async execution context.
 */
export function getTenantId(): string | undefined {
  return tenantStorage.getStore()?.tenantId;
}

/**
 * Runs a function within the context of a specific tenantId.
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantStorage.run({ tenantId }, fn);
}
