import { Doctor } from '../models/Doctor';
import { DoctorScheduleException } from '../models/DoctorScheduleException';
import { Appointment } from '../models/Appointment';
import { AppError } from '../utils/errors';

export type SlotStatus = 'available' | 'booked' | 'break' | 'leave' | 'blocked' | 'past';

export interface ISlot {
  startTime: string; // "09:00"
  endTime: string;   // "09:20"
  status: SlotStatus;
  reason?: string;
  appointmentId?: string;
}

export interface IDayAvailability {
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
  slots: ISlot[];
  message?: string;
}

export class SchedulingService {
  /**
   * Converts "HH:MM" to minutes from midnight
   */
  public static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Converts minutes from midnight to "HH:MM"
   */
  public static minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Checks if two time intervals [startA, endA) and [startB, endB) overlap
   */
  public static isOverlapping(
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ): boolean {
    const aStart = this.timeToMinutes(startA);
    const aEnd = this.timeToMinutes(endA);
    const bStart = this.timeToMinutes(startB);
    const bEnd = this.timeToMinutes(endB);
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  }

  /**
   * Calculates actual doctor availability slots for a specific date
   */
  public static async getDoctorAvailability(
    doctorId: string,
    dateStr: string
  ): Promise<IDayAvailability> {
    const doctor = await Doctor.findById(doctorId).populate('departmentId').lean();
    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    if (!doctor.isActive) {
      return {
        doctorId: doctor._id.toString(),
        doctorName: doctor.fullName,
        departmentId: (doctor.departmentId as any)?._id?.toString() || '',
        date: dateStr,
        dayOfWeek: 0,
        consultationDuration: doctor.consultationDuration,
        consultationFee: doctor.consultationFee,
        isWorkingDay: false,
        totalSlots: 0,
        availableCount: 0,
        bookedCount: 0,
        slots: [],
        message: 'Doctor is currently marked as inactive.',
      };
    }

    // Determine target day of week in UTC/local date
    const targetDate = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday...

    const daySchedule = doctor.weeklySchedule.find(
      (s) => s.dayOfWeek === dayOfWeek && s.isAvailable
    );

    if (!daySchedule) {
      return {
        doctorId: doctor._id.toString(),
        doctorName: doctor.fullName,
        departmentId: (doctor.departmentId as any)?._id?.toString() || '',
        date: dateStr,
        dayOfWeek,
        consultationDuration: doctor.consultationDuration,
        consultationFee: doctor.consultationFee,
        isWorkingDay: false,
        totalSlots: 0,
        availableCount: 0,
        bookedCount: 0,
        slots: [],
        message: 'Doctor does not hold consultations on this day of the week.',
      };
    }

    // Check exceptions (leaves, holidays, emergency blocks)
    const exceptions = await DoctorScheduleException.find({
      doctorId: doctor._id,
      date: dateStr,
    }).lean();

    const allDayException = exceptions.find((e) => e.isAllDay);
    if (allDayException) {
      return {
        doctorId: doctor._id.toString(),
        doctorName: doctor.fullName,
        departmentId: (doctor.departmentId as any)?._id?.toString() || '',
        date: dateStr,
        dayOfWeek,
        consultationDuration: doctor.consultationDuration,
        consultationFee: doctor.consultationFee,
        isWorkingDay: false,
        totalSlots: 0,
        availableCount: 0,
        bookedCount: 0,
        slots: [],
        message: `Doctor unavailable: ${allDayException.reason} (${allDayException.exceptionType.toUpperCase()})`,
      };
    }

    // Active appointments for that doctor on that date (excluding Cancelled)
    const activeAppointments = await Appointment.find({
      doctorId: doctor._id,
      appointmentDate: dateStr,
      status: { $ne: 'Cancelled' },
    }).lean();

    const duration = doctor.consultationDuration || 20;
    const startMin = this.timeToMinutes(daySchedule.startTime);
    const endMin = this.timeToMinutes(daySchedule.endTime);

    // Current time comparison for "past" slots if viewing today
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    const slots: ISlot[] = [];

    for (let current = startMin; current + duration <= endMin; current += duration) {
      const slotStart = this.minutesToTime(current);
      const slotEnd = this.minutesToTime(current + duration);

      // Check scheduled breaks (e.g. Lunch 13:00 - 14:00)
      const matchedBreak = daySchedule.breaks?.find((b) =>
        this.isOverlapping(slotStart, slotEnd, b.startTime, b.endTime)
      );

      if (matchedBreak) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: 'break',
          reason: matchedBreak.label || 'Scheduled Break',
        });
        continue;
      }

      // Check partial exceptions
      const matchedException = exceptions.find(
        (e) =>
          !e.isAllDay &&
          e.startTime &&
          e.endTime &&
          this.isOverlapping(slotStart, slotEnd, e.startTime, e.endTime)
      );

      if (matchedException) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: matchedException.exceptionType === 'leave' ? 'leave' : 'blocked',
          reason: matchedException.reason,
        });
        continue;
      }

      // Check existing active appointment
      const matchedApt = activeAppointments.find(
        (apt) => apt.startTime === slotStart || this.isOverlapping(slotStart, slotEnd, apt.startTime, apt.endTime)
      );

      if (matchedApt) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: 'booked',
          reason: 'Reserved Appointment',
          appointmentId: matchedApt.appointmentId,
        });
        continue;
      }

      // Check if slot has passed today
      if (dateStr === todayStr && current < currentMinutesNow) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: 'past',
          reason: 'Time passed',
        });
        continue;
      }

      // Available!
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        status: 'available',
      });
    }

    const availableCount = slots.filter((s) => s.status === 'available').length;
    const bookedCount = slots.filter((s) => s.status === 'booked').length;

    return {
      doctorId: doctor._id.toString(),
      doctorName: doctor.fullName,
      departmentId: (doctor.departmentId as any)?._id?.toString() || '',
      date: dateStr,
      dayOfWeek,
      consultationDuration: duration,
      consultationFee: doctor.consultationFee,
      isWorkingDay: true,
      workingHours: {
        startTime: daySchedule.startTime,
        endTime: daySchedule.endTime,
      },
      totalSlots: slots.length,
      availableCount,
      bookedCount,
      slots,
    };
  }

  /**
   * Validates if a doctor is free for a requested slot on a given date
   */
  public static async validateSlotAvailability(
    doctorId: string,
    dateStr: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<{ available: boolean; reason?: string }> {
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor || !doctor.isActive) {
      return { available: false, reason: 'Doctor is inactive or not found' };
    }

    const targetDate = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = targetDate.getDay();
    const daySchedule = doctor.weeklySchedule.find(
      (s) => s.dayOfWeek === dayOfWeek && s.isAvailable
    );

    if (!daySchedule) {
      return { available: false, reason: 'Doctor is not scheduled to work on this day' };
    }

    // Check doctor working bounds
    const reqStart = this.timeToMinutes(startTime);
    const reqEnd = this.timeToMinutes(endTime);
    const schedStart = this.timeToMinutes(daySchedule.startTime);
    const schedEnd = this.timeToMinutes(daySchedule.endTime);

    if (reqStart < schedStart || reqEnd > schedEnd) {
      return {
        available: false,
        reason: `Requested time is outside working hours (${daySchedule.startTime} - ${daySchedule.endTime})`,
      };
    }

    // Check breaks
    const breakConflict = daySchedule.breaks?.find((b) =>
      this.isOverlapping(startTime, endTime, b.startTime, b.endTime)
    );
    if (breakConflict) {
      return { available: false, reason: `Slot falls during ${breakConflict.label}` };
    }

    // Check exceptions
    const exceptions = await DoctorScheduleException.find({
      doctorId: doctor._id,
      date: dateStr,
    }).lean();

    for (const exc of exceptions) {
      if (exc.isAllDay) {
        return { available: false, reason: `Doctor on ${exc.exceptionType}: ${exc.reason}` };
      }
      if (exc.startTime && exc.endTime && this.isOverlapping(startTime, endTime, exc.startTime, exc.endTime)) {
        return { available: false, reason: `Doctor blocked (${exc.reason})` };
      }
    }

    // Check existing active appointments
    const query: any = {
      doctorId: doctor._id,
      appointmentDate: dateStr,
      status: { $ne: 'Cancelled' },
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
      query.appointmentId = { $ne: excludeAppointmentId };
    }

    const existingAppointments = await Appointment.find(query).lean();
    const conflict = existingAppointments.find((apt) =>
      this.isOverlapping(startTime, endTime, apt.startTime, apt.endTime)
    );

    if (conflict) {
      return {
        available: false,
        reason: 'Time slot has already been reserved by another patient',
      };
    }

    return { available: true };
  }
}
