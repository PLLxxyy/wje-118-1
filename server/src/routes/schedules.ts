import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, organizerMiddleware } from '../middleware/auth';

const router = Router();

// Get my schedules (volunteer)
router.get('/my', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const schedules = db.prepare(`
      SELECT s.*, e.name as event_name, e.city, e.date as event_date,
             p.name as position_name, p.location_point
      FROM schedules s
      JOIN events e ON s.event_id = e.id
      JOIN positions p ON s.position_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.date ASC, s.time_start ASC
    `).all(userId);
    res.json({ schedules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get schedules for an event (organizer)
router.get('/event/:eventId', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const schedules = db.prepare(`
      SELECT s.*, u.username, u.phone as user_phone,
             p.name as position_name, p.location_point
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      JOIN positions p ON s.position_id = p.id
      WHERE s.event_id = ?
      ORDER BY s.date ASC, s.time_start ASC, p.name ASC
    `).all(req.params.eventId);
    res.json({ schedules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create/update schedule (organizer)
router.post('/', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { user_id, event_id, position_id, date, time_start, time_end, contact_person = '', contact_phone = '' } = req.body;

    if (!user_id || !event_id || !position_id || !date || !time_start || !time_end) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO schedules (user_id, event_id, position_id, date, time_start, time_end, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(user_id, event_id, position_id, date, time_start, time_end, contact_person, contact_phone);

    // Notify volunteer about schedule
    const event = db.prepare('SELECT name FROM events WHERE id = ?').get(event_id) as any;
    db.prepare(
      'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)'
    ).run(
      user_id,
      'schedule_created',
      '排班通知',
      `您已被安排参加「${event?.name || ''}」，日期：${date}，时间：${time_start}-${time_end}，请准时到岗。`
    );

    res.json({ id: result.lastInsertRowid, message: '排班创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update schedule
router.put('/:id', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id) as any;
    if (!schedule) {
      res.status(404).json({ error: '排班记录不存在' });
      return;
    }

    const { date, time_start, time_end, contact_person, contact_phone } = req.body;
    db.prepare(
      'UPDATE schedules SET date = ?, time_start = ?, time_end = ?, contact_person = ?, contact_phone = ? WHERE id = ?'
    ).run(
      date || schedule.date,
      time_start || schedule.time_start,
      time_end || schedule.time_end,
      contact_person !== undefined ? contact_person : schedule.contact_person,
      contact_phone !== undefined ? contact_phone : schedule.contact_phone,
      req.params.id
    );

    // Notify volunteer about schedule change
    db.prepare(
      'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)'
    ).run(
      schedule.user_id,
      'schedule_updated',
      '排班变更通知',
      `您的排班已更新，新时间：${date || schedule.date} ${time_start || schedule.time_start}-${time_end || schedule.time_end}，请及时查看。`
    );

    res.json({ message: '排班更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete schedule
router.delete('/:id', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id) as any;
    if (!schedule) {
      res.status(404).json({ error: '排班记录不存在' });
      return;
    }

    db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);

    db.prepare(
      'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)'
    ).run(
      schedule.user_id,
      'schedule_cancelled',
      '排班取消通知',
      `您在 ${schedule.date} ${schedule.time_start}-${schedule.time_end} 的排班已被取消。`
    );

    res.json({ message: '排班删除成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
