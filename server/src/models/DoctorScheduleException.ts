import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDoctorScheduleException extends Document {
  doctorId: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  exceptionType: 'leave' | 'holiday' | 'blocked' | 'break';
  isAllDay: boolean;
  startTime?: string; // "10:00"
  endTime?: string;   // "12:00"
  reason: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const doctorScheduleExceptionSchema = new Schema<IDoctorScheduleException>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    exceptionType: {
      type: String,
      enum: ['leave', 'holiday', 'blocked', 'break'],
      required: true,
    },
    isAllDay: { type: Boolean, default: true },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    reason: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

doctorScheduleExceptionSchema.index({ doctorId: 1, date: 1 });

export const DoctorScheduleException = mongoose.model<IDoctorScheduleException>(
  'DoctorScheduleException',
  doctorScheduleExceptionSchema
);
