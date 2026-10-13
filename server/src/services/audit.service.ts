import { AuditLog } from '../models/AuditLog';
import { AuthUser } from '../middleware/auth';

export interface AuditLogParams {
  user?: AuthUser;
  action: string;
  resourceType: 'Patient' | 'Doctor' | 'Department' | 'Appointment' | 'Queue' | 'User' | 'Settings';
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  public static async log(params: AuditLogParams): Promise<void> {
    try {
      await AuditLog.create({
        actorUserId: params.user?.id || null,
        actorName: params.user?.name || 'System / Anonymous',
        actorRole: params.user?.role || 'system',
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        safeMetadata: params.metadata || {},
        ipAddress: params.ipAddress || '',
        timestamp: new Date(),
      });
    } catch (err: any) {
      console.error('[AuditService] Failed to record audit log:', err.message);
    }
  }
}
