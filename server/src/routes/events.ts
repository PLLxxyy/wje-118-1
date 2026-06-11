import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, organizerMiddleware } from '../middleware/auth';

const router = Router();

// Get all events (public)
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, city } = req.query;
    let sql = `
      SELECT e.*, u.username as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    if (city) {
      sql += ' AND e.city LIKE ?';
      params.push(`%${city}%`);
    }

    sql += ' ORDER BY e.created_at DESC';
    const events = db.prepare(sql).all(...params);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get my events (organizer) - MUST be before /:id
router.get('/my/list', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const events = db.prepare(
      'SELECT * FROM events WHERE organizer_id = ? ORDER BY created_at DESC'
    ).all(userId);
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single event
router.get('/:id', (req: Request, res: Response) => {
  try {
    const event = db.prepare(`
      SELECT e.*, u.username as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!event) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    const positions = db.prepare(
      'SELECT * FROM positions WHERE event_id = ? ORDER BY id'
    ).all(req.params.id);

    res.json({ event, positions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create event (organizer only)
router.post('/', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { name, city, date, description = '', status = 'recruiting' } = req.body;

    if (!name || !city || !date) {
      res.status(400).json({ error: '赛事名称、城市和日期为必填项' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO events (organizer_id, name, city, date, description, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, name, city, date, description, status);

    res.json({ id: result.lastInsertRowid, message: '赛事创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update event (organizer only, must be owner)
router.put('/:id', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as any;

    if (!event) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    if (event.organizer_id !== userId && role !== 'admin') {
      res.status(403).json({ error: '无权修改此赛事' });
      return;
    }

    const { name, city, date, description, status } = req.body;
    db.prepare(
      'UPDATE events SET name = ?, city = ?, date = ?, description = ?, status = ? WHERE id = ?'
    ).run(
      name || event.name,
      city || event.city,
      date || event.date,
      description !== undefined ? description : event.description,
      status || event.status,
      req.params.id
    );

    res.json({ message: '赛事更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete event
router.delete('/:id', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as any;

    if (!event) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    if (event.organizer_id !== userId && role !== 'admin') {
      res.status(403).json({ error: '无权删除此赛事' });
      return;
    }

    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ message: '赛事删除成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
