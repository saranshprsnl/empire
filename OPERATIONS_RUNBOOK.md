# Empire Operations & SRE Runbook

Operational manual detailing deployment validation, caching configurations, database migrations, disaster recovery procedures, and backup scripts.

## 1. Database Migrations
Always run dry-runs on database migrations before applying them to production RDS clusters:
```bash
# Check diff
npx prisma migrate status

# Apply migrations securely
npx prisma migrate deploy
```

## 2. Backup Strategy (RDS & S3/R2)
Automated database backups are handled via AWS RDS snapshot retention settings (configured for 30-day recovery windows).
For manual database dumps, execute the pg_dump utility inside target networks:
```bash
pg_dump $DATABASE_URL -F c -b -v -f "/backups/empire-$(date +%F).dump"
```
For bucket uploads replication, utilize AWS S3 cross-region replication hooks or run Cloudflare R2 bucket mirror scripts.

## 3. Cache & Queue Management (Redis)
Redis is used for caching session cookies and powering BullMQ queues. If queues stall:
- Check Redis memory limits: `redis-cli info memory`
- Inspect active worker threads: `ps aux | grep worker`
- Failed tasks are automatically moved to BullMQ's Dead-Letter Queue (DLQ). To inspect or retry failed jobs, connect to the Redis database using BullMQ monitoring tools.

## 4. Disaster Recovery (DR) Plan
In the event of database corruption or regional outage:
1. **Redirect Traffic:** Update Cloudflare DNS records to route traffic to the secondary active-passive failover region.
2. **Restore Database:** Spin up a new RDS instance using the latest automated snapshot from AWS.
3. **Inject Credentials:** Update environment variables in Vercel/Render with the new connection credentials and trigger a production deployment.
