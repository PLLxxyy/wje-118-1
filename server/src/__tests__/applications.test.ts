import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'marathon-volunteer-secret-2026';

function createTestApp() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'volunteer' CHECK(role IN ('volunteer', 'organizer', 'admin')),
      phone TEXT DEFAULT '',
      id_card TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'recruiting' CHECK(status IN ('recruiting', 'ongoing', 'finished')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    );
    CREATE TABLE positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      people_needed INTEGER NOT NULL DEFAULT 1,
      people_assigned INTEGER NOT NULL DEFAULT 0,
      time_start TEXT NOT NULL,
      time_end TEXT NOT NULL,
      location_point TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
    CREATE TABLE applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      available_times TEXT DEFAULT '',
      personal_info TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (position_id) REFERENCES positions(id)
    );
    CREATE TABLE schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_start TEXT NOT NULL,
      time_end TEXT NOT NULL,
      contact_person TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (position_id) REFERENCES positions(id)
    );
    CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const app = express();
  app.use(express.json());

  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: '未登录，请先登录' });
      return;
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: '登录已过期，请重新登录' });
    }
  };

  app.delete('/api/applications/:id', authMiddleware, (req: any, res: any) => {
    try {
      const { userId, role } = req.user;

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

  return { app, db };
}

function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

describe('取消报名接口', () => {
  let app: express.Express;
  let db: Database.Database;

  beforeAll(() => {
    const result = createTestApp();
    app = result.app;
    db = result.db;
  });

  beforeEach(() => {
    db.prepare('DELETE FROM applications').run();
    db.prepare('DELETE FROM positions').run();
    db.prepare('DELETE FROM events').run();
    db.prepare('DELETE FROM users').run();

    const volHash = bcrypt.hashSync('vol123', 10);
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(1, 'vol1', 'vol1@test.com', volHash, 'volunteer', '13800000001');

    const orgHash = bcrypt.hashSync('org123', 10);
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(2, 'org1', 'org1@test.com', orgHash, 'organizer', '13800000002');

    db.prepare(
      'INSERT INTO events (id, organizer_id, name, city, date, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(1, 2, '测试赛事', '北京', '2026-10-18', 'recruiting');

    db.prepare(
      'INSERT INTO positions (id, event_id, name, people_needed, people_assigned, time_start, time_end, location_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(1, 1, '补给站志愿者', 20, 0, '06:00', '14:00', '5km补给站');
  });

  it('志愿者可以取消待审核的报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(1, 1, 1, 1, 'pending');

    const token = generateToken(1, 'volunteer');

    const res = await request(app)
      .delete('/api/applications/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('报名已取消');

    const row = db.prepare('SELECT * FROM applications WHERE id = 1').get();
    expect(row).toBeUndefined();
  });

  it('志愿者不能取消已通过审核的报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(1, 1, 1, 1, 'approved');

    const token = generateToken(1, 'volunteer');

    const res = await request(app)
      .delete('/api/applications/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('仅待审核状态的报名可取消');

    const row = db.prepare('SELECT * FROM applications WHERE id = 1').get() as any;
    expect(row).toBeDefined();
    expect(row.status).toBe('approved');
  });

  it('志愿者不能取消已拒绝的报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(1, 1, 1, 1, 'rejected');

    const token = generateToken(1, 'volunteer');

    const res = await request(app)
      .delete('/api/applications/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('仅待审核状态的报名可取消');
  });

  it('赛事方角色不能取消报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(1, 1, 1, 1, 'pending');

    const token = generateToken(2, 'organizer');

    const res = await request(app)
      .delete('/api/applications/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('仅志愿者可取消报名');
  });

  it('管理员角色不能取消报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(1, 1, 1, 1, 'pending');

    const token = generateToken(99, 'admin');

    const res = await request(app)
      .delete('/api/applications/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('仅志愿者可取消报名');
  });

  it('志愿者不能取消他人的报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(1, 1, 1, 1, 'pending');

    const otherVolHash = bcrypt.hashSync('vol456', 10);
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(3, 'vol2', 'vol2@test.com', otherVolHash, 'volunteer', '13800000003');

    const token = generateToken(3, 'volunteer');

    const res = await request(app)
      .delete('/api/applications/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('无权取消他人报名');
  });

  it('取消不存在的报名返回404', async () => {
    const token = generateToken(1, 'volunteer');

    const res = await request(app)
      .delete('/api/applications/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('报名记录不存在');
  });

  it('未登录不能取消报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(1, 1, 1, 1, 'pending');

    const res = await request(app)
      .delete('/api/applications/1');

    expect(res.status).toBe(401);
  });
});
