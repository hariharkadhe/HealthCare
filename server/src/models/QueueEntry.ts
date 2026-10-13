import mongoose, { Document, Schema, Types } from 'mongoose';

export type QueueStatus = 'Waiting' | 'In Consultation' | 'Completed' | 'No-show' | 'Skipped';

export interface IQueueEntry extends Document {
  appointmentId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  tokenNumber: string; // e.g. "T-01"
  queueDate: string;   // "YYYY-MM-DD"
  checkInTime: Date;
  queueStatus: QueueStatus;
  priority: 'Normal' | 'Urgent';
  estimatedWaitMinutes?: number;
  calledAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const queueEntrySchema = new Schema<IQueueEntry>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    tokenNumber: { type: String, required: true },
    queueDate: { type: String, required: true, index: true },
    checkInTime: { type: Date, default: Date.now },
    queueStatus: {
      type: String,
      enum: ['Waiting', 'In Consultation', 'Completed', 'No-show', 'Skipped'],
      default: 'Waiting',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Normal', 'Urgent'],
      default: 'Normal',
    },
    estimatedWaitMinutes: { type: Number, default: 0 },
    calledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

queueEntrySchema.index({ doctorId: 1, queueDate: 1, queueStatus: 1 });

export const QueueEntry = mongoose.model<IQueueEntry>('QueueEntry', queueEntrySchema);
