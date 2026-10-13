import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment';
import {
  appointmentBookSchema,
  appointmentRescheduleSchema,
  appointmentCancelSchema,
  appointmentStatusSchema,
} from '../validators/schemas';
import { AppointmentService } from '../services/appointment.service';
import { QueueService } from '../services/queue.service';
import { AppError } from '../utils/errors';

export const bookAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = appointmentBookSchema.parse(req.body);
    const appointment = await AppointmentService.bookAppointment(validated, req.user);

    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      date,
      doctorId,
      departmentId,
      patientId,
      status,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (date) {
      query.appointmentDate = date;
    }
    if (doctorId) {
      query.doctorId = doctorId;
    }
    if (departmentId) {
      query.departmentId = departmentId;
    }
    if (patientId) {
      query.patientId = patientId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = search.trim();
      query.$or = [{ appointmentId: { $regex: s, $options: 'i' } }];
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patientId', 'fullName patientId phone gender dateOfBirth')
        .populate('doctorId', 'fullName specialization roomNumber consultationFee')
        .populate('departmentId', 'name code')
        .sort({ appointmentDate: -1, startTime: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findOne({
      $or: [
        { appointmentId: id },
        ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
      ],
    })
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'departmentId' } })
      .populate('departmentId')
      .populate('bookedBy', 'name email role')
      .lean();

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = appointmentCancelSchema.parse(req.body);

    const cancelled = await AppointmentService.cancelAppointment(id, validated.reason, req.user);

    res.json({
      success: true,
      data: cancelled,
    });
  } catch (err) {
    next(err);
  }
};

export const rescheduleAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = appointmentRescheduleSchema.parse(req.body);

    const rescheduled = await AppointmentService.rescheduleAppointment(
      id,
      validated.newDate,
      validated.newStartTime,
      validated.newEndTime,
      validated.reason,
      req.user
    );

    res.json({
      success: true,
      data: rescheduled,
    });
  } catch (err) {
    next(err);
  }
};

export const checkInAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { priority = 'Normal' } = req.body;

    const result = await QueueService.checkInPatient(id, priority, req.user);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = appointmentStatusSchema.parse(req.body);

    const updated = await AppointmentService.updateStatus(id, validated.status, validated.notes, req.user);

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
