export type UserRole = 'admin' | 'receptionist' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  doctorId?: string;
}

export interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  registrationDate: string;
  notes?: string;
  createdAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  icon?: string;
  isActive: boolean;
}

export interface DoctorBreak {
  startTime: string;
  endTime: string;
  label: string;
}

export interface WeeklyScheduleItem {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  breaks: DoctorBreak[];
  maxCapacity?: number;
}

export interface Doctor {
  _id: string;
  doctorId: string;
  fullName: string;
  avatarUrl?: string;
  qualification: string;
  specialization: string;
  departmentId: Department | string;
  experience: number;
  consultationFee: number;
  consultationDuration: number;
  weeklySchedule: WeeklyScheduleItem[];
  roomNumber?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Checked In'
  | 'Waiting'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'No-show';

export interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: Patient;
  doctorId: Doctor;
  departmentId: Department;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: 'New Consultation' | 'Follow-up' | 'Emergency' | 'Routine Checkup';
  consultationFee: number;
  status: AppointmentStatus;
  bookingSource: 'Walk-in' | 'Reception' | 'Online';
  bookedBy?: { _id: string; name: string };
  cancellationReason?: string;
  notes?: string;
  tokenNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueEntry {
  _id: string;
  appointmentId: Appointment;
  doctorId: Doctor;
  patientId: Patient;
  tokenNumber: string;
  queueDate: string;
  checkInTime: string;
  queueStatus: 'Waiting' | 'In Consultation' | 'Completed' | 'No-show' | 'Skipped';
  priority: 'Normal' | 'Urgent';
  estimatedWaitMinutes?: number;
  calledAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'break' | 'leave' | 'blocked' | 'past';
  reason?: string;
  appointmentId?: string;
}

export interface DayAvailability {
  doctorId: string;
  doctorName: string;
  departmentId: string;
  date: string;
  dayOfWeek: number;
  consultationDuration: number;
  consultationFee: number;
  isWorkingDay: boolean;
  workingHours?: { startTime: string; endTime: string };
  totalSlots: number;
  availableCount: number;
  bookedCount: number;
  slots: Slot[];
  message?: string;
}

export interface NotificationItem {
  _id: string;
  type: 'booking' | 'reschedule' | 'cancel' | 'checkin' | 'system' | 'leave';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  readAt?: string;
  createdAt: string;
}

export interface HospitalSettings {
  _id: string;
  hospitalName: string;
  tagline: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactNumber: string;
  emergencyContact: string;
  email: string;
  website: string;
  logoUrl?: string;
  timezone: string;
  workingHours: {
    openingTime: string;
    closingTime: string;
    workingDays: string[];
  };
  receiptSettings: {
    headerTitle: string;
    footerNote: string;
    taxId?: string;
  };
}

export interface DashboardSummary {
  date: string;
  metrics: {
    totalAppointmentsToday: number;
    patientsCheckedIn: number;
    patientsWaiting: number;
    patientsInConsultation: number;
    completedAppointments: number;
    cancelledAppointments: number;
    doctorsAvailableToday: number;
    totalActiveDoctors: number;
  };
  departmentStats: Array<{
    departmentId: string;
    name: string;
    code: string;
    count: number;
    completed: number;
  }>;
  doctorStats: Array<{
    doctorId: string;
    fullName: string;
    specialization: string;
    roomNumber?: string;
    totalAppointments: number;
    completed: number;
    inConsultation: number;
    waiting: number;
  }>;
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  waitingQueue: QueueEntry[];
  recentActivity: any[];
}
