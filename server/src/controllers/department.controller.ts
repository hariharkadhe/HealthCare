import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/Department';
import { departmentCreateSchema } from '../validators/schemas';
import { AppError } from '../utils/errors';
import { AuditService } from '../services/audit.service';

export const getDepartments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: departments,
    });
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = departmentCreateSchema.parse(req.body);
    const existing = await Department.findOne({
      $or: [{ name: validated.name }, { code: validated.code.toUpperCase() }],
    });

    if (existing) {
      throw new AppError('A department with this name or code already exists', 409);
    }

    const dept = await Department.create({
      ...validated,
      code: validated.code.toUpperCase(),
    });

    await AuditService.log({
      user: req.user,
      action: 'CREATE_DEPARTMENT',
      resourceType: 'Department',
      resourceId: dept._id.toString(),
      metadata: { name: dept.name, code: dept.code },
    });

    res.status(201).json({
      success: true,
      data: dept,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const dept = await Department.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!dept) {
      throw new AppError('Department not found', 404);
    }

    await AuditService.log({
      user: req.user,
      action: 'UPDATE_DEPARTMENT',
      resourceType: 'Department',
      resourceId: dept._id.toString(),
      metadata: req.body,
    });

    res.json({
      success: true,
      data: dept,
    });
  } catch (err) {
    next(err);
  }
};
