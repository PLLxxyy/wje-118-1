import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, organizerMiddleware } from '../middleware/auth';

const router = Router();

// Apply for a position (volunteer)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { event_id, position_id, available_times = '', personal_info = '' } = req.body;

    if (!event_id || !position_id) {
      res.status(400).json({ error: '赛事ID和岗位ID为必填项' });
      return;
    }

    const existing = db.prepare(
      'SELECT id FROM applications WHERE user_id = ? AND event_id = ? AND position_id = ?'
    ).get(userId, event_id, position_id);
    if (existing) {
      res.status(400).json({ error: '您已报名过该岗位' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO applications (user_id, event_id, position_id, available_times, personal_info) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, event_id, position_id, available_times, personal_info);

    res.json({ id: result.lastInsertRowid, message: '报名成功，等待审核' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get my applications (volunteer)
router.get('/my', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const applications = db.prepare(`
      SELECT a.*, e.name as event_name, p.name as position_name, p.location_point
      FROM applications a
      JOIN events e ON a.event_id = e.id
      JOIN positions p ON a.position_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).all(userId);
    res.json({ applications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get applications for an event (organizer)
router.get('/event/:eventId', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT a.*, u.username, u.email, u.phone, u.id_card,
             p.name as position_name, p.location_point, p.time_start, p.time_end
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN positions p ON a.position_id = p.id
      WHERE a.event_id = ?
    `;
    const params: any[] = [req.params.eventId];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.created_at DESC';
    const applications = db.prepare(sql).all(...params);
    res.json({ applications });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel application (volunteer)
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;

    if (role !== 'volunteer') {
      res.status(403).json({ error: '仅志愿者可取消报名' });
      return;
    }

    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any;

    if (!application) {
      res.status(404).json({ error: '报名记录不存在' });
      return;
    }

    if (application.user_id !== userId) {
      res.status(403).json({ error: '无权取消他人报名' });
      return;
    }

    if (application.status !== 'pending') {
      res.status(400).json({ error: '仅待审核状态的报名可取消' });
      return;
    }

    db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);

    res.json({ message: '报名已取消' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/reject application (organizer)
router.put('/:id/status', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: '状态只能是 approved 或 rejected' });
      return;
    }

    const application = db.prepare(`
      SELECT a.*, p.name as position_name, e.name as event_name
      FROM applications a
      JOIN positions p ON a.position_id = p.id
      JOIN events e ON a.event_id = e.id
      WHERE a.id = ?
    `).get(req.params.id) as any;

    if (!application) {
      res.status(404).json({ error: '报名记录不存在' });
      return;
    }

    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);

    // If approved, update position people_assigned count
    if (status === 'approved') {
      db.prepare('UPDATE positions SET people_assigned = people_assigned + 1 WHERE id = ?').run(application.position_id);

      // Auto-create notification for approval
      db.prepare(
        'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)'
      ).run(
        application.user_id,
        'application_approved',
        '报名审核通过',
        `恭喜！您报名的「${application.event_name}」赛事「${application.position_name}」岗位已通过审核，请关注后续排班安排。`
      );

      // Auto-create schedule
      const event = db.prepare('SELECT date FROM events WHERE id = ?').get(application.event_id) as any;
      const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(application.position_id) as any;
      if (event && position) {
        db.prepare(
          'INSERT INTO schedules (user_id, event_id, position_id, date, time_start, time_end, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          application.user_id,
          application.event_id,
          application.position_id,
          event.date,
          position.time_start,
          position.time_end,
          '待分配',
          ''
        );
      }
    } else if (status === 'rejected') {
      db.prepare(
        'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)'
      ).run(
        application.user_id,
        'application_rejected',
        '报名未通过',
        `很抱歉，您报名的「${application.event_name}」赛事「${application.position_name}」岗位未通过审核。`
      );
    }

    res.json({ message: status === 'approved' ? '审核通过' : '已拒绝' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
