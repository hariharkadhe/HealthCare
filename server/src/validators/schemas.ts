import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'receptionist', 'doctor']),
  doctorId: z.string().optional(),
});

export const patientCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required (min 2 characters)'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  phone: z.string().min(7, 'Valid contact number is required').max(15),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyContact: z
    .object({
      name: z.string().default(''),
      phone: z.string().default(''),
      relation: z.string().default(''),
    })
    .optional(),
  notes: z.string().optional().or(z.literal('')),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export const departmentCreateSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().min(2, 'Department code is required').max(10),
  description: z.string().optional().default(''),
  icon: z.string().optional().default('Stethoscope'),
  isActive: z.boolean().optional().default(true),
});

export const doctorBreakSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  label: z.string().default('Break'),
});

export const weeklyScheduleItemSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isAvailable: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  breaks: z.array(doctorBreakSchema).default([]),
  maxCapacity: z.number().optional().default(30),
});

export const doctorCreateSchema = z.object({
  fullName: z.string().min(2, 'Doctor name is required'),
  avatarUrl: z.string().optional().default(''),
  qualification: z.string().min(2, 'Qualification is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  experience: z.number().min(0, 'Experience must be positive'),
  consultationFee: z.number().min(0, 'Consultation fee must be positive'),
  consultationDuration: z.number().min(5).max(120).default(20),
  weeklySchedule: z.array(weeklyScheduleItemSchema).default([]),
  roomNumber: z.string().optional().default('Room 101'),
  phone: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

export const doctorUpdateSchema = doctorCreateSchema.partial();

export const doctorScheduleExceptionSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  exceptionType: z.enum(['leave', 'holiday', 'blocked', 'break']),
  isAllDay: z.boolean().default(true),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().min(2, 'Reason is required'),
});

export const appointmentBookSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
  appointmentType: z
    .enum(['New Consultation', 'Follow-up', 'Emergency', 'Routine Checkup'])
    .default('New Consultation'),
  consultationFee: z.number().min(0),
  bookingSource: z.enum(['Walk-in', 'Reception', 'Online']).default('Walk-in'),
  notes: z.string().optional().default(''),
});

export const appointmentRescheduleSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  newStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
  newEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
  reason: z.string().optional().default('Patient requested reschedule'),
});

export const appointmentCancelSchema = z.object({
  reason: z.string().min(2, 'Cancellation reason is required'),
});

export const appointmentStatusSchema = z.object({
  status: z.enum([
    'Scheduled',
    'Checked In',
    'Waiting',
    'In Consultation',
    'Completed',
    'Cancelled',
    'No-show',
  ]),
  notes: z.string().optional(),
});

export const queueStatusUpdateSchema = z.object({
  status: z.enum(['Waiting', 'In Consultation', 'Completed', 'No-show', 'Skipped']),
  notes: z.string().optional(),
});
