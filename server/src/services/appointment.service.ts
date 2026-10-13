import mongoose from 'mongoose';
import { Appointment, IAppointment, AppointmentStatus } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { QueueEntry } from '../models/QueueEntry';
import { SchedulingService } from './scheduling.service';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { AppError } from '../utils/errors';
import { AuthUser } from '../middleware/auth';

export interface BookAppointmentInput {
  patientId: string;
  doctorId: string;
  departmentId: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  appointmentType: 'New Consultation' | 'Follow-up' | 'Emergency' | 'Routine Checkup';
  consultationFee: number;
  bookingSource?: 'Walk-in' | 'Reception' | 'Online';
  notes?: string;
}

export class AppointmentService {
  /**
   * Generates a unique human-readable Appointment ID
   */
  public static generateAppointmentId(dateStr: string): string {
    const compactDate = dateStr.replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `APT-${compactDate}-${rand}`;
  }

  /**
   * Concurrency-safe appointment booking
   */
  public static async bookAppointment(
    input: BookAppointmentInput,
    user?: AuthUser
  ): Promise<IAppointment> {
    // 1. Verify patient exists
    const patient = await Patient.findById(input.patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // 2. Verify doctor exists and is active
    const doctor = await Doctor.findById(input.doctorId).populate('departmentId');
    if (!doctor || !doctor.isActive) {
      throw new AppError('Doctor not found or inactive', 400);
    }

    // 3. Validate slot availability via engine
    const availabilityCheck = await SchedulingService.validateSlotAvailability(
      input.doctorId,
      input.appointmentDate,
      input.startTime,
      input.endTime
    );

    if (!availabilityCheck.available) {
      throw new AppError(
        availabilityCheck.reason || 'Requested appointment slot is no longer available',
        409
      );
    }

    // 4. Generate unique appointment ID
    const appointmentId = this.generateAppointmentId(input.appointmentDate);

    try {
      const newAppointment = await Appointment.create({
        appointmentId,
        patientId: patient._id,
        doctorId: doctor._id,
        departmentId: input.departmentId,
        appointmentDate: input.appointmentDate,
        startTime: input.startTime,
        endTime: input.endTime,
        appointmentType: input.appointmentType,
        consultationFee: input.consultationFee,
        bookingSource: input.bookingSource || 'Walk-in',
        bookedBy: user?.id || null,
        notes: input.notes || '',
        status: 'Scheduled',
      });

      // Audit Log
      await AuditService.log({
        user,
        action: 'BOOK_APPOINTMENT',
        resourceType: 'Appointment',
        resourceId: newAppointment.appointmentId,
        metadata: {
          patientName: patient.fullName,
          doctorName: doctor.fullName,
          date: input.appointmentDate,
          time: input.startTime,
        },
      });

      // In-app notification
      await NotificationService.notify({
        roleTarget: 'all',
        type: 'booking',
        title: 'New Appointment Booked',
        message: `Appointment ${newAppointment.appointmentId} booked for ${patient.fullName} with Dr. ${doctor.fullName} on ${input.appointmentDate} at ${input.startTime}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        metadata: {
          appointmentId: newAppointment.appointmentId,
          patientId: patient._id.toString(),
          doctorId: doctor._id.toString(),
        },
      });

      return await Appointment.findById(newAppointment._id)
        .populate('patientId')
        .populate({ path: 'doctorId', populate: { path: 'departmentId' } })
        .populate('departmentId') as IAppointment;
    } catch (err: any) {
      if (err.code === 11000) {
        throw new AppError(
          'Slot reservation conflict: Another receptionist just booked this exact slot. Please choose another slot.',
          409
        );
      }
      throw err;
    }
  }

  /**
   * Reschedule an appointment safely
   */
  public static async rescheduleAppointment(
    appointmentIdOrDocId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    reason: string,
    user?: AuthUser
  ): Promise<IAppointment> {
    const appointment = await Appointment.findOne({
      $or: [
        { appointmentId: appointmentIdOrDocId },
        ...(mongoose.isValidObjectId(appointmentIdOrDocId) ? [{ _id: appointmentIdOrDocId }] : []),
      ],
    }).populate('patientId doctorId');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status === 'Cancelled' || appointment.status === 'Completed') {
      throw new AppError(`Cannot reschedule an appointment in '${appointment.status}' status.`, 400);
    }

    // Validate new slot
    const availabilityCheck = await SchedulingService.validateSlotAvailability(
      appointment.doctorId._id.toString(),
      newDate,
      newStartTime,
      newEndTime,
      appointment._id.toString()
    );

    if (!availabilityCheck.available) {
      throw new AppError(
        availabilityCheck.reason || 'Selected reschedule slot is unavailable.',
        409
      );
    }

    const oldDate = appointment.appointmentDate;
    const oldTime = appointment.startTime;

    appointment.appointmentDate = newDate;
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;
    appointment.notes = appointment.notes
      ? `${appointment.notes} | Rescheduled from ${oldDate} ${oldTime}: ${reason}`
      : `Rescheduled from ${oldDate} ${oldTime}: ${reason}`;

    await appointment.save();

    await AuditService.log({
      user,
      action: 'RESCHEDULE_APPOINTMENT',
      resourceType: 'Appointment',
      resourceId: appointment.appointmentId,
      metadata: { oldDate, oldTime, newDate, newStartTime, reason },
    });

    await NotificationService.notify({
      roleTarget: 'all',
      type: 'reschedule',
      title: 'Appointment Rescheduled',
      message: `Appointment ${appointment.appointmentId} rescheduled to ${newDate} at ${newStartTime} (${reason})`,
      metadata: { appointmentId: appointment.appointmentId },
    });

    return appointment;
  }

  /**
   * Cancel an appointment and safely release the slot
   */
  public static async cancelAppointment(
    appointmentIdOrDocId: string,
    reason: string,
    user?: AuthUser
  ): Promise<IAppointment> {
    const appointment = await Appointment.findOne({
      $or: [
        { appointmentId: appointmentIdOrDocId },
        ...(mongoose.isValidObjectId(appointmentIdOrDocId) ? [{ _id: appointmentIdOrDocId }] : []),
      ],
    }).populate('patientId doctorId');

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.status === 'Cancelled') {
      throw new AppError('Appointment is already cancelled.', 400);
    }

    if (appointment.status === 'Completed') {
      throw new AppError('Cannot cancel a completed consultation.', 400);
    }

    appointment.status = 'Cancelled';
    appointment.cancellationReason = reason;
    await appointment.save();

    // If an active queue entry exists, mark it no-show or completed
    await QueueEntry.updateMany(
      { appointmentId: appointment._id, queueStatus: { $in: ['Waiting', 'In Consultation'] } },
      { queueStatus: 'No-show', notes: `Cancelled: ${reason}` }
    );

    await AuditService.log({
      user,
      action: 'CANCEL_APPOINTMENT',
      resourceType: 'Appointment',
      resourceId: appointment.appointmentId,
      metadata: { reason },
    });

    await NotificationService.notify({
      roleTarget: 'all',
      type: 'cancel',
      title: 'Appointment Cancelled',
      message: `Appointment ${appointment.appointmentId} cancelled. Reason: ${reason}`,
      metadata: { appointmentId: appointment.appointmentId },
    });

    return appointment;
  }

  /**
   * Updates status with workflow validation
   */
  public static async updateStatus(
    appointmentIdOrDocId: string,
    newStatus: AppointmentStatus,
    notes?: string,
    user?: AuthUser
  ): Promise<IAppointment> {
    const appointment = await Appointment.findOne({
      $or: [
        { appointmentId: appointmentIdOrDocId },
        ...(mongoose.isValidObjectId(appointmentIdOrDocId) ? [{ _id: appointmentIdOrDocId }] : []),
      ],
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const currentStatus = appointment.status;

    // Validate valid transitions
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      'Scheduled': ['Checked In', 'Cancelled', 'No-show'],
      'Checked In': ['Waiting', 'In Consultation', 'Cancelled', 'No-show'],
      'Waiting': ['In Consultation', 'Cancelled', 'No-show'],
      'In Consultation': ['Completed', 'Cancelled'],
      'Completed': [],
      'Cancelled': [],
      'No-show': ['Scheduled'],
    };

    if (currentStatus !== newStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'.`,
        400
      );
    }

    appointment.status = newStatus;
    if (notes) {
      appointment.notes = appointment.notes ? `${appointment.notes} | ${notes}` : notes;
    }
    await appointment.save();

    // Synchronize queue entry if exists
    if (newStatus === 'In Consultation') {
      await QueueEntry.updateOne(
        { appointmentId: appointment._id },
        { queueStatus: 'In Consultation', calledAt: new Date() }
      );
    } else if (newStatus === 'Completed') {
      await QueueEntry.updateOne(
        { appointmentId: appointment._id },
        { queueStatus: 'Completed', completedAt: new Date() }
      );
    } else if (newStatus === 'No-show') {
      await QueueEntry.updateOne(
        { appointmentId: appointment._id },
        { queueStatus: 'No-show' }
      );
    }

    await AuditService.log({
      user,
      action: 'UPDATE_APPOINTMENT_STATUS',
      resourceType: 'Appointment',
      resourceId: appointment.appointmentId,
      metadata: { from: currentStatus, to: newStatus },
    });

    return appointment;
  }
}
