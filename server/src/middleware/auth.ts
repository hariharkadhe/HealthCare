import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { User } from '../models/User';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'receptionist' | 'doctor';
  doctorId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const secret = process.env.JWT_SECRET || 'medicare_pro_secret_fallback';
    const decoded = jwt.verify(token, secret) as any;

    const user = await User.findById(decoded.id).lean();
    if (!user || !user.isActive) {
      return next(new AppError('User account not found or deactivated.', 401));
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      doctorId: user.doctorId,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
};

export const requireRole = (...allowedRoles: Array<'admin' | 'receptionist' | 'doctor'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Role '${req.user.role}' lacks permission for this action.`,
          403
        )
      );
    }

    next();
  };
};
