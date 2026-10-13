import { Request, Response, NextFunction } from 'express';
import { Doctor } from '../models/Doctor';
import { DoctorScheduleException } from '../models/DoctorScheduleException';
import {
  doctorCreateSchema,
  doctorUpdateSchema,
  doctorScheduleExceptionSchema,
} from '../validators/schemas';
import { SchedulingService } from '../services/scheduling.service';
import { AuditService } from '../services/audit.service';
import { AppError } from '../utils/errors';

export const getDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { departmentId, isActive, search } = req.query;
    const query: any = {};

    if (departmentId) {
      query.departmentId = departmentId;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = search.trim();
      query.$or = [
        { fullName: { $regex: s, $options: 'i' } },
        { specialization: { $regex: s, $options: 'i' } },
        { doctorId: { $regex: s, $options: 'i' } },
      ];
    }

    const doctors = await Doctor.find(query).populate('departmentId').sort({ fullName: 1 }).lean();

    res.json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    next(err);
  }
};

export const createDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = doctorCreateSchema.parse(req.body);

    const count = await Doctor.countDocuments();
    const doctorId = `DOC-${100 + count + 1}`;

    const doctor = await Doctor.create({
      ...validated,
      doctorId,
    });

    await AuditService.log({
      user: req.user,
      action: 'CREATE_DOCTOR',
      resourceType: 'Doctor',
      resourceId: doctor.doctorId,
      metadata: { fullName: doctor.fullName, specialization: doctor.specialization },
    });

    const populated = await Doctor.findById(doctor._id).populate('departmentId');

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({
      $or: [{ doctorId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    })
      .populate('departmentId')
      .lean();

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = doctorUpdateSchema.parse(req.body);

    const doctor = await Doctor.findOneAndUpdate(
      { $or: [{ doctorId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])] },
      { $set: validated },
      { new: true }
    ).populate('departmentId');

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    await AuditService.log({
      user: req.user,
      action: 'UPDATE_DOCTOR',
      resourceType: 'Doctor',
      resourceId: doctor.doctorId,
      metadata: validated,
    });

    res.json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({
      $or: [{ doctorId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    }).select('doctorId fullName weeklySchedule consultationDuration');

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDoctorSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { weeklySchedule, consultationDuration } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { $or: [{ doctorId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])] },
      {
        $set: {
          ...(weeklySchedule ? { weeklySchedule } : {}),
          ...(consultationDuration ? { consultationDuration } : {}),
        },
      },
      { new: true }
    );

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    await AuditService.log({
      user: req.user,
      action: 'UPDATE_DOCTOR_SCHEDULE',
      resourceType: 'Doctor',
      resourceId: doctor.doctorId,
      metadata: { weeklySchedule },
    });

    res.json({
      success: true,
      data: doctor,
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new AppError('Date query param is required in YYYY-MM-DD format', 400);
    }

    const doctor = await Doctor.findOne({
      $or: [{ doctorId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const availability = await SchedulingService.getDoctorAvailability(doctor._id.toString(), date);

    res.json({
      success: true,
      data: availability,
    });
  } catch (err) {
    next(err);
  }
};

export const addDoctorScheduleException = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({
      $or: [{ doctorId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const validated = doctorScheduleExceptionSchema.parse({
      ...req.body,
      doctorId: doctor._id.toString(),
    });

    const exception = await DoctorScheduleException.create({
      ...validated,
      doctorId: doctor._id,
      createdBy: req.user?.id || null,
    });

    await AuditService.log({
      user: req.user,
      action: 'ADD_SCHEDULE_EXCEPTION',
      resourceType: 'Doctor',
      resourceId: doctor.doctorId,
      metadata: validated,
    });

    res.status(201).json({
      success: true,
      data: exception,
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorScheduleExceptions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({
      $or: [{ doctorId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const exceptions = await DoctorScheduleException.find({ doctorId: doctor._id })
      .sort({ date: 1 })
      .lean();

    res.json({
      success: true,
      data: exceptions,
    });
  } catch (err) {
    next(err);
  }
};
