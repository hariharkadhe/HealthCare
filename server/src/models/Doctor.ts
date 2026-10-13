import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDoctorBreak {
  startTime: string; // "13:00"
  endTime: string;   // "14:00"
  label: string;     // "Lunch Break"
}

export interface IWeeklyScheduleItem {
  dayOfWeek: number; // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  isAvailable: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  breaks: IDoctorBreak[];
  maxCapacity?: number;
}

export interface IDoctor extends Document {
  doctorId: string;
  userId?: Types.ObjectId;
  fullName: string;
  avatarUrl?: string;
  qualification: string;
  specialization: string;
  departmentId: Types.ObjectId;
  experience: number;
  consultationFee: number;
  consultationDuration: number; // in minutes (e.g. 20)
  weeklySchedule: IWeeklyScheduleItem[];
  roomNumber?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorBreakSchema = new Schema<IDoctorBreak>(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    label: { type: String, default: 'Break' },
  },
  { _id: false }
);

const weeklyScheduleSchema = new Schema<IWeeklyScheduleItem>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isAvailable: { type: Boolean, default: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    breaks: [doctorBreakSchema],
    maxCapacity: { type: Number, default: 30 },
  },
  { _id: false }
);

const doctorSchema = new Schema<IDoctor>(
  {
    doctorId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    fullName: { type: String, required: true, trim: true, index: true },
    avatarUrl: { type: String, default: '' },
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    experience: { type: Number, required: true, default: 1 },
    consultationFee: { type: Number, required: true, default: 500 },
    consultationDuration: { type: Number, required: true, default: 20 }, // 20 mins default
    weeklySchedule: [weeklyScheduleSchema],
    roomNumber: { type: String, default: 'Room 101' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);
