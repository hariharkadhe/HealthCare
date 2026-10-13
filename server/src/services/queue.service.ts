import mongoose from 'mongoose';
import { QueueEntry, IQueueEntry, QueueStatus } from '../models/QueueEntry';
import { Appointment } from '../models/Appointment';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { AppError } from '../utils/errors';
import { AuthUser } from '../middleware/auth';

export class QueueService {
  /**
   * Generates next sequential token for doctor on a given date (e.g. "T-01", "T-02")
   */
  public static async getNextToken(doctorId: string, dateStr: string): Promise<string> {
    const count = await QueueEntry.countDocuments({
      doctorId,
      queueDate: dateStr,
    });
    const nextNum = count + 1;
    return `T-${String(nextNum).padStart(2, '0')}`;
  }

  /**
   * Check in an arriving patient
   */
  public static async checkInPatient(
    appointmentIdentifier: string,
    priority: 'Normal' | 'Urgent' = 'Normal',
    user?: AuthUser
  ): Promise<{ appointment: any; queueEntry: IQueueEntry }> {
    // 1. Locate appointment
    const appointment = await Appointment.findOne({
      $or: [
        { appointmentId: appointmentIdentifier },
        ...(mongoose.isValidObjectId(appointmentIdentifier)
          ? [{ _id: appointmentIdentifier }]
          : []),
      ],
    }).populate('patientId doctorId departmentId');

    if (!appointment) {
      throw new AppError('Appointment not found for check-in.', 404);
    }

    if (appointment.status === 'Cancelled') {
      throw new AppError('Cannot check in a cancelled appointment.', 400);
    }

    if (appointment.status === 'Completed') {
      throw new AppError('This appointment has already been completed.', 400);
    }

    // Check if already checked in
    const existingQueue = await QueueEntry.findOne({
      appointmentId: appointment._id,
      queueStatus: { $in: ['Waiting', 'In Consultation'] },
    });

    if (existingQueue) {
      return { appointment, queueEntry: existingQueue };
    }

    // 2. Fetch doctor for consultation duration
    const doctor = await Doctor.findById(appointment.doctorId._id);
    const duration = doctor?.consultationDuration || 20;

    // 3. Count waiting patients ahead
    const todayStr = appointment.appointmentDate;
    const waitingAhead = await QueueEntry.countDocuments({
      doctorId: appointment.doctorId._id,
      queueDate: todayStr,
      queueStatus: 'Waiting',
    });

    const estimatedWaitMinutes = waitingAhead * duration;
    const tokenNumber = await this.getNextToken(appointment.doctorId._id.toString(), todayStr);

    // 4. Create Queue entry
    const queueEntry = await QueueEntry.create({
      appointmentId: appointment._id,
      doctorId: appointment.doctorId._id,
      patientId: appointment.patientId._id,
      tokenNumber,
      queueDate: todayStr,
      checkInTime: new Date(),
      queueStatus: 'Waiting',
      priority,
      estimatedWaitMinutes,
    });

    // 5. Update appointment status
    appointment.status = 'Checked In';
    appointment.tokenNumber = tokenNumber;
    await appointment.save();

    const patient = appointment.patientId as any;

    // Audit and Notification
    await AuditService.log({
      user,
      action: 'PATIENT_CHECK_IN',
      resourceType: 'Queue',
      resourceId: tokenNumber,
      metadata: {
        appointmentId: appointment.appointmentId,
        patientName: patient.fullName,
        tokenNumber,
        priority,
      },
    });

    await NotificationService.notify({
      roleTarget: 'all',
      type: 'checkin',
      title: 'Patient Checked In',
      message: `Token ${tokenNumber} issued to ${patient.fullName}. Waiting position #${waitingAhead + 1} for Dr. ${(doctor as any)?.fullName}`,
      metadata: { appointmentId: appointment.appointmentId, tokenNumber },
    });

    return { appointment, queueEntry };
  }

  /**
   * Update Queue item status (e.g., Calling to Consultation, Completed, No-show)
   */
  public static async updateQueueStatus(
    queueEntryId: string,
    newStatus: QueueStatus,
    notes?: string,
    user?: AuthUser
  ): Promise<IQueueEntry> {
    const queueEntry = await QueueEntry.findById(queueEntryId).populate('appointmentId patientId doctorId');
    if (!queueEntry) {
      throw new AppError('Queue entry not found', 404);
    }

    queueEntry.queueStatus = newStatus;
    if (newStatus === 'In Consultation') {
      queueEntry.calledAt = new Date();
      await Appointment.findByIdAndUpdate(queueEntry.appointmentId, { status: 'In Consultation' });
    } else if (newStatus === 'Completed') {
      queueEntry.completedAt = new Date();
      await Appointment.findByIdAndUpdate(queueEntry.appointmentId, { status: 'Completed' });
    } else if (newStatus === 'No-show') {
      await Appointment.findByIdAndUpdate(queueEntry.appointmentId, { status: 'No-show' });
    }

    if (notes) {
      queueEntry.notes = notes;
    }

    await queueEntry.save();

    await AuditService.log({
      user,
      action: 'UPDATE_QUEUE_STATUS',
      resourceType: 'Queue',
      resourceId: queueEntry.tokenNumber,
      metadata: { newStatus },
    });

    return queueEntry;
  }

  /**
   * Fetch current queue for doctor or hospital for given date
   */
  public static async getQueue(
    dateStr: string,
    doctorId?: string,
    isPublicView = false
  ): Promise<any[]> {
    const query: any = { queueDate: dateStr };
    if (doctorId) {
      query.doctorId = doctorId;
    }

    const entries = await QueueEntry.find(query)
      .populate('patientId', 'fullName gender patientId phone')
      .populate('doctorId', 'fullName specialization roomNumber')
      .populate('appointmentId', 'appointmentId startTime appointmentType')
      .sort({ priority: -1, createdAt: 1 })
      .lean();

    if (isPublicView) {
      // Privacy-safe masking for public waiting monitors
      return entries.map((e: any) => {
        const pName = e.patientId?.fullName || 'Patient';
        const nameParts = pName.split(' ');
        const maskedName =
          nameParts.length > 1
            ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
            : `${nameParts[0].slice(0, 3)}***`;

        return {
          _id: e._id,
          tokenNumber: e.tokenNumber,
          maskedPatientName: maskedName,
          doctorName: e.doctorId?.fullName,
          roomNumber: e.doctorId?.roomNumber,
          queueStatus: e.queueStatus,
          priority: e.priority,
          estimatedWaitMinutes: e.estimatedWaitMinutes,
          checkInTime: e.checkInTime,
          calledAt: e.calledAt,
        };
      });
    }

    return entries;
  }
}
