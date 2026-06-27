# Empire Community SaaS Platform

Empire is an enterprise-grade, multi-tenant Business Operating System designed for creators to manage their courses, membership subscriptions, team tasks, and automated workflows.

## 🛠️ Technology Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Cache & Queue:** Redis via BullMQ and custom session storage
- **Authentication:** Clerk Auth (Administrative panels) & Custom Magic Links (Community members)
- **Monetization:** Stripe Connect payouts and recurring subscription gateways
- **Real-Time:** Socket.io channels
- **Search Engine:** Meilisearch
- **IaC:** Terraform configurations

## 🚀 Local Quickstart

### 1. Prerequisites
Ensure you have Docker and Node.js v20/v22 installed on your system.

### 2. Launch Services
Run the local Docker environment to start Postgres, Redis, and Meilisearch:
```bash
docker-compose up -d
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
Initialize schema, apply migrations, and populate the mock seeds:
```bash
npx prisma db push
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to interact with the platform.

## 📁 Repository Structure
- `src/app/` - App Router page layouts and webhook routes
- `src/components/` - Subdomain UI components (CRM, monetization, community feed, task boards)
- `src/lib/` - Tenant context resolvers, Prisma extensions, and WebSocket/Stripe wrappers
- `src/server/` - tRPC handlers, queues, and background services/workers
- `terraform/` - IaC schemas to provision cloud assets
- `tests/` - Unit tests verifying rulesets
