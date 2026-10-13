import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { loginSchema } from '../validators/schemas';
import { AppError } from '../utils/errors';
import { AuditService } from '../services/audit.service';

const getJwtCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await User.findOne({ email: validated.email.toLowerCase() }).select('+passwordHash');

    if (!user || !(await user.comparePassword(validated.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    const secret = process.env.JWT_SECRET || 'medicare_pro_secret_fallback';
    const token = jwt.sign(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        doctorId: user.doctorId,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, getJwtCookieOptions());

    await AuditService.log({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: user.doctorId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.clearCookie('token', getJwtCookieOptions());

    if (req.user) {
      await AuditService.log({
        user: req.user,
        action: 'USER_LOGOUT',
        resourceType: 'User',
        resourceId: req.user.id,
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: user.doctorId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
