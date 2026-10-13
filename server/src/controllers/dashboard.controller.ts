import { Request, Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment';
import { Doctor } from '../models/Doctor';
import { QueueEntry } from '../models/QueueEntry';
import { Department } from '../models/Department';
import { AuditLog } from '../models/AuditLog';

export const getDashboardSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;
    const now = new Date();
    const todayStr =
      typeof date === 'string' && date
        ? date
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
            now.getDate()
          ).padStart(2, '0')}`;

    const targetDate = new Date(`${todayStr}T00:00:00`);
    const dayOfWeek = targetDate.getDay();

    // Parallel calculations from real MongoDB collections
    const [
      todayAppointments,
      activeDoctors,
      todayQueue,
      departments,
      recentActivity,
    ] = await Promise.all([
      Appointment.find({ appointmentDate: todayStr })
        .populate('patientId', 'fullName patientId phone gender')
        .populate('doctorId', 'fullName specialization roomNumber')
        .populate('departmentId', 'name code')
        .sort({ startTime: 1 })
        .lean(),
      Doctor.find({ isActive: true }).populate('departmentId').lean(),
      QueueEntry.find({ queueDate: todayStr })
        .populate('patientId', 'fullName patientId phone')
        .populate('doctorId', 'fullName specialization roomNumber')
        .populate('appointmentId', 'appointmentId startTime appointmentType')
        .sort({ priority: -1, createdAt: 1 })
        .lean(),
      Department.find({ isActive: true }).lean(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10).lean(),
    ]);

    // Statistics calculation
    const totalToday = todayAppointments.length;
    const checkedInCount = todayAppointments.filter((a) => a.status === 'Checked In').length;
    const waitingCount = todayAppointments.filter((a) => a.status === 'Waiting').length;
    const inConsultationCount = todayAppointments.filter((a) => a.status === 'In Consultation').length;
    const completedCount = todayAppointments.filter((a) => a.status === 'Completed').length;
    const cancelledCount = todayAppointments.filter((a) => a.status === 'Cancelled').length;

    // Doctors available on this day of week
    const doctorsOnDuty = activeDoctors.filter((doc) => {
      const schedule = doc.weeklySchedule?.find((s) => s.dayOfWeek === dayOfWeek);
      return schedule && schedule.isAvailable;
    });

    // Department breakdown
    const departmentStats = departments.map((dept) => {
      const deptApts = todayAppointments.filter(
        (a) => a.departmentId?._id?.toString() === dept._id.toString()
      );
      return {
        departmentId: dept._id,
        name: dept.name,
        code: dept.code,
        count: deptApts.length,
        completed: deptApts.filter((a) => a.status === 'Completed').length,
      };
    });

    // Doctor breakdown
    const doctorStats = doctorsOnDuty.map((doc) => {
      const docApts = todayAppointments.filter(
        (a) => a.doctorId?._id?.toString() === doc._id.toString()
      );
      return {
        doctorId: doc._id,
        fullName: doc.fullName,
        specialization: doc.specialization,
        roomNumber: doc.roomNumber,
        totalAppointments: docApts.length,
        completed: docApts.filter((a) => a.status === 'Completed').length,
        inConsultation: docApts.filter((a) => a.status === 'In Consultation').length,
        waiting: docApts.filter((a) => a.status === 'Waiting' || a.status === 'Checked In').length,
      };
    });

    // Upcoming appointments today (status Scheduled or Checked In)
    const upcomingAppointments = todayAppointments.filter(
      (a) => a.status === 'Scheduled' || a.status === 'Checked In'
    );

    res.json({
      success: true,
      data: {
        date: todayStr,
        metrics: {
          totalAppointmentsToday: totalToday,
          patientsCheckedIn: checkedInCount,
          patientsWaiting: waitingCount,
          patientsInConsultation: inConsultationCount,
          completedAppointments: completedCount,
          cancelledAppointments: cancelledCount,
          doctorsAvailableToday: doctorsOnDuty.length,
          totalActiveDoctors: activeDoctors.length,
        },
        departmentStats,
        doctorStats,
        todayAppointments,
        upcomingAppointments,
        waitingQueue: todayQueue,
        recentActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};
