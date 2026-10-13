import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const role = req.user?.role || 'receptionist';
    const userId = req.user?.id;

    const notifications = await Notification.find({
      $or: [
        { recipientUserId: userId },
        { roleTarget: 'all' },
        { roleTarget: role },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { readAt: new Date() });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = req.user?.role || 'receptionist';
    const userId = req.user?.id;

    await Notification.updateMany(
      {
        $or: [{ recipientUserId: userId }, { roleTarget: 'all' }, { roleTarget: role }],
        readAt: null,
      },
      { readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = '50', action, resourceType } = req.query;
    const query: any = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string, 10) || 50)
      .lean();

    res.json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};
