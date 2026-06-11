import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get my notifications
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const notifications = db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    res.json({ notifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(userId) as any;
    res.json({ count: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as read
router.put('/:id/read', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: '已标记为已读' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId);
    res.json({ message: '全部已读' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
