import { Request, Response, NextFunction } from 'express';
import { QueueService } from '../services/queue.service';
import { queueStatusUpdateSchema } from '../validators/schemas';

export const getHospitalQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, doctorId } = req.query;
    const now = new Date();
    const todayStr =
      typeof date === 'string' && date
        ? date
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
            now.getDate()
          ).padStart(2, '0')}`;

    const queue = await QueueService.getQueue(todayStr, doctorId as string, false);

    res.json({
      success: true,
      data: queue,
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.query;
    const now = new Date();
    const todayStr =
      typeof date === 'string' && date
        ? date
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
            now.getDate()
          ).padStart(2, '0')}`;

    const queue = await QueueService.getQueue(todayStr, undefined, true);

    res.json({
      success: true,
      data: queue,
    });
  } catch (err) {
    next(err);
  }
};

export const getDoctorQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const now = new Date();
    const todayStr =
      typeof date === 'string' && date
        ? date
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
            now.getDate()
          ).padStart(2, '0')}`;

    const queue = await QueueService.getQueue(todayStr, id, false);

    res.json({
      success: true,
      data: queue,
    });
  } catch (err) {
    next(err);
  }
};

export const updateQueueEntryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = queueStatusUpdateSchema.parse(req.body);

    const updated = await QueueService.updateQueueStatus(id, validated.status, validated.notes, req.user);

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
