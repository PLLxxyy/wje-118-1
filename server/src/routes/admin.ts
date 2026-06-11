import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, adminMiddleware, organizerMiddleware } from '../middleware/auth';

const router = Router();

// Get all users (admin)
router.get('/users', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    let sql = 'SELECT id, username, email, role, phone, id_card, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC';
    const users = db.prepare(sql).all(...params);
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats (admin)
router.get('/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const totalVolunteers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'volunteer'").get() as any).count;
    const totalOrganizers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'organizer'").get() as any).count;
    const totalEvents = (db.prepare('SELECT COUNT(*) as count FROM events').get() as any).count;
    const recruitingEvents = (db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'recruiting'").get() as any).count;
    const finishedEvents = (db.prepare("SELECT COUNT(*) as count FROM events WHERE status = 'finished'").get() as any).count;
    const totalApplications = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as any).count;
    const pendingApplications = (db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'").get() as any).count;
    const totalCheckins = (db.prepare('SELECT COUNT(*) as count FROM checkins').get() as any).count;

    // Per-event recruitment progress
    const eventProgress = db.prepare(`
      SELECT e.id, e.name, e.city, e.date, e.status,
             COUNT(DISTINCT p.id) as total_positions,
             SUM(p.people_needed) as total_needed,
             SUM(p.people_assigned) as total_assigned,
             COUNT(DISTINCT a.id) as total_applications,
             COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pending_count
      FROM events e
      LEFT JOIN positions p ON e.id = p.event_id
      LEFT JOIN applications a ON e.id = a.event_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `).all();

    res.json({
      totalUsers,
      totalVolunteers,
      totalOrganizers,
      totalEvents,
      recruitingEvents,
      finishedEvents,
      totalApplications,
      pendingApplications,
      totalCheckins,
      eventProgress
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Evaluate volunteer (organizer)
router.post('/evaluate', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId: createdBy } = (req as any).user;
    const { user_id, event_id, score, comment = '', certificate_url = '' } = req.body;

    if (!user_id || !event_id || !score) {
      res.status(400).json({ error: '用户ID、赛事ID和评分为必填项' });
      return;
    }

    if (score < 1 || score > 5) {
      res.status(400).json({ error: '评分范围为1-5' });
      return;
    }

    const existing = db.prepare(
      'SELECT id FROM evaluations WHERE user_id = ? AND event_id = ?'
    ).get(user_id, event_id);

    if (existing) {
      db.prepare(
        'UPDATE evaluations SET score = ?, comment = ?, certificate_url = ? WHERE user_id = ? AND event_id = ?'
      ).run(score, comment, certificate_url, user_id, event_id);
    } else {
      db.prepare(
        'INSERT INTO evaluations (user_id, event_id, score, comment, certificate_url, created_by) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(user_id, event_id, score, comment, certificate_url, createdBy);
    }

    // Notify volunteer
    const event = db.prepare('SELECT name FROM events WHERE id = ?').get(event_id) as any;
    db.prepare(
      'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)'
    ).run(
      user_id,
      'evaluation',
      '服务评价通知',
      `您在「${event?.name || ''}」的服务评价已出，评分：${score}/5。${certificate_url ? '您的志愿服务证书已发放，请查看。' : ''}`
    );

    res.json({ message: '评价成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get evaluations for an event
router.get('/evaluations/event/:eventId', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const evaluations = db.prepare(`
      SELECT ev.*, u.username, u.email
      FROM evaluations ev
      JOIN users u ON ev.user_id = u.id
      WHERE ev.event_id = ?
      ORDER BY ev.created_at DESC
    `).all(req.params.eventId);
    res.json({ evaluations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get my evaluations (volunteer)
router.get('/evaluations/my', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const evaluations = db.prepare(`
      SELECT ev.*, e.name as event_name
      FROM evaluations ev
      JOIN events e ON ev.event_id = e.id
      WHERE ev.user_id = ?
      ORDER BY ev.created_at DESC
    `).all(userId);
    res.json({ evaluations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export volunteer list for an event
router.get('/export/volunteers/:eventId', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const volunteers = db.prepare(`
      SELECT u.username, u.email, u.phone, u.id_card,
             p.name as position_name, p.location_point,
             a.status as application_status,
             s.date as schedule_date, s.time_start, s.time_end,
             c.checkin_time, c.checkout_time,
             ev.score, ev.comment, ev.certificate_url
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN positions p ON a.position_id = p.id
      LEFT JOIN schedules s ON s.user_id = a.user_id AND s.event_id = a.event_id AND s.position_id = a.position_id
      LEFT JOIN checkins c ON c.user_id = a.user_id AND c.event_id = a.event_id AND c.position_id = a.position_id
      LEFT JOIN evaluations ev ON ev.user_id = a.user_id AND ev.event_id = a.event_id
      WHERE a.event_id = ? AND a.status = 'approved'
      ORDER BY p.name, u.username
    `).all(req.params.eventId);
    res.json({ volunteers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
