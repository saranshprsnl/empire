# Empire Developer Guide

This document maps the architectural patterns, security designs, and testing guidelines for developers working on the Empire platform.

## 1. Multi-Tenant Architecture

Empire employs a **shared database, shared schema** architecture. Every model scoped to a tenant includes a `tenantId` field.

### Dynamic Context Tracking (`src/lib/tenant-context.ts`)
Request-scoped tenant context is mapped using Node's `AsyncLocalStorage`:
- The Next.js middleware resolves hostnames/subdomains, extracts the active `tenantId`, and passes it in headers.
- tRPC base procedure wrappers catch this header and wrap all queries inside `runWithTenant(tenantId, async () => { ... })`.

### Automated Gating Interceptors (`src/lib/prisma.ts`)
We extend the Prisma client using a query filter extension. The extension intercepts all database queries for tenant-scoped models and appends `where: { tenantId }` constraints automatically:
```typescript
// Auto-intercepts findMany, findFirst, update, delete, etc.
anyArgs.where.tenantId = tenantId;
```
To query data across multiple tenants (e.g. platform admin dashboards), query models outside of the `runWithTenant` block or query non-scoped tables.

## 2. Authentication Systems

Empire handles authentication using a hybrid system:
1. **Administrative Staff (Creators/Editors):** Protected by Clerk. Requires routing under `/dashboard/*` or `/admin/*`. Enforced via Clerk Next.js middleware blocks.
2. **Community Members (End Users):** Protected by custom passwordless Magic Links. Tokens are verified against Redis and stored in secure cookies (`__member_session`). Enforced under `/community/[slug]/*` pages.

## 3. Real-Time WebSockets (`src/lib/socket.ts`)
Sockets are routed to a WebSocket server cluster using `socket.io-client`. At runtime, connection requests attach `x-tenant-id` parameters in headers to automatically place connections in isolated tenant rooms.

## 4. Writing Unit Tests
All unit tests are executed using Vitest. When adding gating rules, payment webhooks, or automation logic, add corresponding unit files in `tests/unit/`.
To execute:
```bash
npm run test:unit
```
