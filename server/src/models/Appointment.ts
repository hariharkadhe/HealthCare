import mongoose, { Document, Schema, Types } from 'mongoose';

export type AppointmentStatus =
  | 'Scheduled'
  | 'Checked In'
  | 'Waiting'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'No-show';

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  departmentId: Types.ObjectId;
  appointmentDate: string; // "YYYY-MM-DD"
  startTime: string;       // "09:20"
  endTime: string;         // "09:40"
  appointmentType: 'New Consultation' | 'Follow-up' | 'Emergency' | 'Routine Checkup';
  consultationFee: number;
  status: AppointmentStatus;
  bookingSource: 'Walk-in' | 'Reception' | 'Online';
  bookedBy?: Types.ObjectId;
  cancellationReason?: string;
  notes?: string;
  tokenNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    appointmentDate: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    appointmentType: {
      type: String,
      enum: ['New Consultation', 'Follow-up', 'Emergency', 'Routine Checkup'],
      default: 'New Consultation',
    },
    consultationFee: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'Scheduled',
        'Checked In',
        'Waiting',
        'In Consultation',
        'Completed',
        'Cancelled',
        'No-show',
      ],
      default: 'Scheduled',
      index: true,
    },
    bookingSource: {
      type: String,
      enum: ['Walk-in', 'Reception', 'Online'],
      default: 'Walk-in',
    },
    bookedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancellationReason: { type: String, default: '' },
    notes: { type: String, default: '' },
    tokenNumber: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Concurrency-safe unique compound index: only non-cancelled appointments enforce uniqueness on doctor + date + startTime
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'Cancelled' } },
  }
);

appointmentSchema.index({ appointmentDate: 1, status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
