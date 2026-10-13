import { Request, Response, NextFunction } from 'express';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { patientCreateSchema, patientUpdateSchema } from '../validators/schemas';
import { AppError } from '../utils/errors';
import { AuditService } from '../services/audit.service';

export const createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = patientCreateSchema.parse(req.body);

    // Normalize phone number (strip whitespace and non-digits)
    const normalizedPhone = validated.phone.replace(/\D/g, '');

    // Check existing phone records to prevent duplicates or flag warnings
    const existing = await Patient.findOne({
      $or: [
        { phone: validated.phone },
        { phone: normalizedPhone },
      ],
    });

    if (existing && !req.query.forceDuplicate) {
      res.status(409).json({
        success: false,
        warning: 'POSSIBLE_DUPLICATE',
        message: `A patient with phone number ${validated.phone} already exists (${existing.fullName}, ID: ${existing.patientId}). Pass '?forceDuplicate=true' if staff verifies this is a different individual.`,
        existingPatient: {
          patientId: existing.patientId,
          fullName: existing.fullName,
          phone: existing.phone,
        },
      });
      return;
    }

    // Generate unique sequential Patient ID
    const count = await Patient.countDocuments();
    const patientId = `PAT-${1000 + count + 1}`;

    const newPatient = await Patient.create({
      ...validated,
      patientId,
      registrationDate: new Date(),
    });

    await AuditService.log({
      user: req.user,
      action: 'REGISTER_PATIENT',
      resourceType: 'Patient',
      resourceId: newPatient.patientId,
      metadata: { fullName: newPatient.fullName, phone: newPatient.phone },
    });

    res.status(201).json({
      success: true,
      data: newPatient,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = search.trim();
      query.$or = [
        { fullName: { $regex: s, $options: 'i' } },
        { patientId: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Patient.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        patients,
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

export const getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await Patient.findOne({
      $or: [{ patientId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])],
    }).lean();

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Include appointment history
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'fullName specialization roomNumber')
      .populate('departmentId', 'name')
      .sort({ appointmentDate: -1, startTime: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        patient,
        appointments,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = patientUpdateSchema.parse(req.body);

    const patient = await Patient.findOneAndUpdate(
      { $or: [{ patientId: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])] },
      { $set: validated },
      { new: true }
    );

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    await AuditService.log({
      user: req.user,
      action: 'UPDATE_PATIENT',
      resourceType: 'Patient',
      resourceId: patient.patientId,
      metadata: validated,
    });

    res.json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
};
