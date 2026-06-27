import { Meilisearch } from 'meilisearch';
import prisma from './prisma';

const meiliHost = process.env.MEILI_HOST || 'http://localhost:7700';
const meiliKey = process.env.MEILI_MASTER_KEY || 'masterKey';

let meiliClient: Meilisearch | null = null;
try {
  meiliClient = new Meilisearch({ host: meiliHost, apiKey: meiliKey });
} catch (err) {
  console.warn('[Meilisearch Indexer] Client failed to initialize:', err);
}

/**
 * Pushes all active tenant member records to Meilisearch index.
 * Gracefully logs failures to prevent pipeline crashes.
 */
export async function syncMeilisearchIndexes(tenantId: string): Promise<boolean> {
  if (!meiliClient) {
    console.warn('[Meilisearch Indexer] Client not initialized. Bypassing sync.');
    return false;
  }

  try {
    const members = await prisma.member.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        status: true,
        tags: true,
        joinedAt: true,
      },
    });

    const index = meiliClient.index('members');
    
    // Add documents in batch
    await index.addDocuments(members);
    console.log(`[Meilisearch Indexer] Successfully synced ${members.length} member documents.`);
    return true;
  } catch (err) {
    console.error('[Meilisearch Indexer] Failed to sync database documents to Meilisearch:', err);
    return false;
  }
}

export default syncMeilisearchIndexes;
