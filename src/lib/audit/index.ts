import { auditLogs } from '@/lib/db/schema';
import type { AppDatabase } from '@/lib/db';

export async function writeAuditLog(db: AppDatabase, event: {
  performedByUserId?: string;
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    performedByUserId: event.performedByUserId,
    targetUserId: event.targetUserId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    description: event.description,
    oldValue: event.oldValue ? JSON.stringify(event.oldValue) : undefined,
    newValue: event.newValue ? JSON.stringify(event.newValue) : undefined,
  });
}
