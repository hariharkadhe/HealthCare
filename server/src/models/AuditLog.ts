import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actorUserId?: Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string;
  resourceType: 'Patient' | 'Doctor' | 'Department' | 'Appointment' | 'Queue' | 'User' | 'Settings';
  resourceId?: string;
  safeMetadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: {
      type: String,
      enum: ['Patient', 'Doctor', 'Department', 'Appointment', 'Queue', 'User', 'Settings'],
      required: true,
      index: true,
    },
    resourceId: { type: String, default: null },
    safeMetadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
