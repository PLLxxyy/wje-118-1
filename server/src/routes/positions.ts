import { Router, Request, Response } from 'express';
import db from '../db';
import { authMiddleware, organizerMiddleware } from '../middleware/auth';

const router = Router();

// Get positions for an event (public)
router.get('/event/:eventId', (req: Request, res: Response) => {
  try {
    const positions = db.prepare(
      'SELECT * FROM positions WHERE event_id = ? ORDER BY id'
    ).all(req.params.eventId);
    res.json({ positions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single position
router.get('/:id', (req: Request, res: Response) => {
  try {
    const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(req.params.id);
    if (!position) {
      res.status(404).json({ error: '岗位不存在' });
      return;
    }
    res.json({ position });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create position (organizer only)
router.post('/', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;
    const { event_id, name, description = '', people_needed = 1, time_start, time_end, location_point = '' } = req.body;

    if (!event_id || !name || !time_start || !time_end) {
      res.status(400).json({ error: '赛事ID、岗位名称、开始时间和结束时间为必填项' });
      return;
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id) as any;
    if (!event) {
      res.status(404).json({ error: '赛事不存在' });
      return;
    }

    if (event.organizer_id !== userId && role !== 'admin') {
      res.status(403).json({ error: '无权为此赛事添加岗位' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO positions (event_id, name, description, people_needed, time_start, time_end, location_point) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(event_id, name, description, people_needed, time_start, time_end, location_point);

    res.json({ id: result.lastInsertRowid, message: '岗位创建成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update position
router.put('/:id', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;
    const position = db.prepare('SELECT p.*, e.organizer_id FROM positions p JOIN events e ON p.event_id = e.id WHERE p.id = ?').get(req.params.id) as any;

    if (!position) {
      res.status(404).json({ error: '岗位不存在' });
      return;
    }

    if (position.organizer_id !== userId && role !== 'admin') {
      res.status(403).json({ error: '无权修改此岗位' });
      return;
    }

    const { name, description, people_needed, time_start, time_end, location_point } = req.body;
    db.prepare(
      'UPDATE positions SET name = ?, description = ?, people_needed = ?, time_start = ?, time_end = ?, location_point = ? WHERE id = ?'
    ).run(
      name || position.name,
      description !== undefined ? description : position.description,
      people_needed || position.people_needed,
      time_start || position.time_start,
      time_end || position.time_end,
      location_point !== undefined ? location_point : position.location_point,
      req.params.id
    );

    res.json({ message: '岗位更新成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete position
router.delete('/:id', authMiddleware, organizerMiddleware, (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user;
    const position = db.prepare('SELECT p.*, e.organizer_id FROM positions p JOIN events e ON p.event_id = e.id WHERE p.id = ?').get(req.params.id) as any;

    if (!position) {
      res.status(404).json({ error: '岗位不存在' });
      return;
    }

    if (position.organizer_id !== userId && role !== 'admin') {
      res.status(403).json({ error: '无权删除此岗位' });
      return;
    }

    db.prepare('DELETE FROM positions WHERE id = ?').run(req.params.id);
    res.json({ message: '岗位删除成功' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
