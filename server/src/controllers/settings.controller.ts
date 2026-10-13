import { Request, Response, NextFunction } from 'express';
import { HospitalSettings } from '../models/HospitalSettings';
import { AuditService } from '../services/audit.service';

export const getHospitalSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await HospitalSettings.findOne().lean();
    if (!settings) {
      settings = await HospitalSettings.create({});
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateHospitalSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let settings = await HospitalSettings.findOne();
    if (!settings) {
      settings = new HospitalSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    await AuditService.log({
      user: req.user,
      action: 'UPDATE_HOSPITAL_SETTINGS',
      resourceType: 'Settings',
      metadata: req.body,
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};
