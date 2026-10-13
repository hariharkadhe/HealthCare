import { Notification } from '../models/Notification';
import { logger } from '../utils/logger';

export interface CreateNotificationParams {
  recipientUserId?: string;
  roleTarget?: 'admin' | 'receptionist' | 'doctor' | 'all';
  type: 'booking' | 'reschedule' | 'cancel' | 'checkin' | 'system' | 'leave';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  patientPhone?: string;
  patientEmail?: string;
}

export class NotificationService {
  public static async notify(params: CreateNotificationParams): Promise<void> {
    try {
      // 1. In-app persistent notification
      await Notification.create({
        recipientUserId: params.recipientUserId || null,
        roleTarget: params.roleTarget || 'all',
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata || {},
      });

      // 2. External delivery boundary (SMS / Email)
      if (params.patientPhone) {
        logger.info(
          `[SMS Service Boundary] In-app notification generated. External SMS gateway (Twilio/AWS SNS) not configured: SMS to ${params.patientPhone} skipped.`
        );
      }
      if (params.patientEmail) {
        logger.info(
          `[Email Service Boundary] In-app notification generated. External SMTP/SES gateway not configured: Email to ${params.patientEmail} skipped.`
        );
      }
    } catch (err: any) {
      logger.error('[NotificationService] Failed to create notification:', err.message);
    }
  }
}
