import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { generateToken, authMiddleware } from '../middleware/auth';
import { User } from '../types';

const router = Router();

// Register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { username, email, password, role = 'volunteer', phone = '', id_card = '' } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: '用户名、邮箱和密码为必填项' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      res.status(400).json({ error: '用户名或邮箱已存在' });
      return;
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, role, phone, id_card) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username, email, password_hash, role, phone, id_card);

    const token = generateToken({ userId: result.lastInsertRowid as number, role });

    res.json({
      token,
      user: { id: result.lastInsertRowid, username, email, role, phone, id_card }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '请输入用户名和密码' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        id_card: user.id_card
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const user = db.prepare('SELECT id, username, email, role, phone, id_card, created_at FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
