import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, organizerMiddleware } from '../middleware/auth';

const router = Router();

// Check in (volunteer)
router.post('/checkin', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { event_id, position_id } = req.body;

    if (!event_id || !position_id) {
      res.status(400).json({ error: '赛事ID和岗位ID为必填项' });
      return;
    }

    // Check if already checked in today without checkout
    const existing = db.prepare(
      "SELECT id FROM checkins WHERE user_id = ? AND event_id = ? AND position_id = ? AND date(checkin_time) = date('now', 'localtime') AND checkout_time = ''"
    ).get(userId, event_id, position_id);

    if (existing) {
      res.status(400).json({ error: '您今天已签到，请先签退' });
      return;
    }

    const checkinTime = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ');

    const result = db.prepare(
      'INSERT INTO checkins (user_id, event_id, position_id, checkin_time, checkout_time) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, event_id, position_id, checkinTime, '');

    res.json({ id: result.lastInsertRowid, checkin_time: checkinTime, message: '签到成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check out (volunteer)
router.post('/checkout', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { event_id, position_id } = req.body;

    if (!event_id || !position_id) {
      res.status(400).json({ error: '赛事ID和岗位ID为必填项' });
      return;
    }

    const checkin = db.prepare(
      "SELECT id FROM checkins WHERE user_id = ? AND event_id = ? AND position_id = ? AND date(checkin_time) = date('now', 'localtime') AND checkout_time = ''"
    ).get(userId, event_id, position_id) as any;

    if (!checkin) {
      res.status(400).json({ error: '未找到今日签到记录' });
      return;
    }

    const checkoutTime = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace('T', ' ');

    db.prepare('UPDATE checkins SET checkout_time = ? WHERE id = ?').run(checkoutTime, checkin.id);

    res.json({ checkout_time: checkoutTime, message: '签退成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get my checkins (volunteer)
router.get('/my', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const checkins = db.prepare(`
      SELECT c.*, e.name as event_name, p.name as position_name, p.location_point
      FROM checkins c
      JOIN events e ON c.event_id = e.id
      JOIN positions p ON c.position_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.checkin_time DESC
    `).all(userId);
    res.json({ checkins });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get checkins for an event (organizer)
router.get('/event/:eventId', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const checkins = db.prepare(`
      SELECT c.*, u.username, u.phone as user_phone,
             p.name as position_name, p.location_point
      FROM checkins c
      JOIN users u ON c.user_id = u.id
      JOIN positions p ON c.position_id = p.id
      WHERE c.event_id = ?
      ORDER BY c.checkin_time DESC
    `).all(req.params.eventId);
    res.json({ checkins });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
