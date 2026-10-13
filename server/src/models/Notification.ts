import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  recipientUserId?: Types.ObjectId; // null = hospital-wide broadcast
  roleTarget?: 'admin' | 'receptionist' | 'doctor' | 'all';
  type: 'booking' | 'reschedule' | 'cancel' | 'checkin' | 'system' | 'leave';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    roleTarget: {
      type: String,
      enum: ['admin', 'receptionist', 'doctor', 'all'],
      default: 'all',
    },
    type: {
      type: String,
      enum: ['booking', 'reschedule', 'cancel', 'checkin', 'system', 'leave'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
