import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { createUserSchema } from '../validators/schemas';
import { AppError } from '../utils/errors';
import { AuditService } from '../services/audit.service';

export const getUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createUserSchema.parse(req.body);
    const existing = await User.findOne({ email: validated.email.toLowerCase() });
    if (existing) {
      throw new AppError('A user account with this email already exists', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const user = await User.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: validated.role,
      doctorId: validated.doctorId || null,
      isActive: true,
    });

    await AuditService.log({
      user: req.user,
      action: 'CREATE_USER',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: { name: user.name, email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, isActive, password } = req.body;

    const updates: any = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select(
      '-passwordHash'
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await AuditService.log({
      user: req.user,
      action: 'UPDATE_USER',
      resourceType: 'User',
      resourceId: user._id.toString(),
      metadata: updates,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
