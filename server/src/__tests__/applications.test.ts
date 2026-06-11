import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from '../index';
import db from '../db';

const JWT_SECRET = 'marathon-volunteer-secret-2026';

function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

function seedTestData() {
  const volHash = bcrypt.hashSync('vol123', 10);
  db.prepare(
    'INSERT INTO users (id, username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(101, 'test_vol', 'test_vol@test.com', volHash, 'volunteer', '13800000101');

  const orgHash = bcrypt.hashSync('org123', 10);
  db.prepare(
    'INSERT INTO users (id, username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(102, 'test_org', 'test_org@test.com', orgHash, 'organizer', '13800000102');

  db.prepare(
    'INSERT INTO events (id, organizer_id, name, city, date, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(201, 102, '测试赛事', '北京', '2026-10-18', 'recruiting');

  db.prepare(
    'INSERT INTO positions (id, event_id, name, people_needed, people_assigned, time_start, time_end, location_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(301, 201, '补给站志愿者', 20, 0, '06:00', '14:00', '5km补给站');
}

describe('取消报名接口（真实路由）', () => {
  beforeAll(() => {
    expect(process.env.VOLUNTEER_DB_MEMORY).toBe('1');
    seedTestData();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM applications').run();
    db.prepare('DELETE FROM schedules').run();
    db.prepare('DELETE FROM notifications').run();
  });

  it('志愿者可以取消待审核的报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(401, 101, 201, 301, 'pending');

    const token = generateToken(101, 'volunteer');

    const res = await request(app)
      .delete('/api/applications/401')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('报名已取消');

    const row = db.prepare('SELECT * FROM applications WHERE id = 401').get();
    expect(row).toBeUndefined();
  });

  it('志愿者不能取消已通过审核的报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(402, 101, 201, 301, 'approved');

    const token = generateToken(101, 'volunteer');

    const res = await request(app)
      .delete('/api/applications/402')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('仅待审核状态的报名可取消');

    const row = db.prepare('SELECT * FROM applications WHERE id = 402').get() as any;
    expect(row).toBeDefined();
    expect(row.status).toBe('approved');
  });

  it('非志愿者角色（赛事方）不能取消报名', async () => {
    db.prepare(
      'INSERT INTO applications (id, user_id, event_id, position_id, status) VALUES (?, ?, ?, ?, ?)'
    ).run(403, 101, 201, 301, 'pending');

    const token = generateToken(102, 'organizer');

    const res = await request(app)
      .delete('/api/applications/403')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('仅志愿者可取消报名');

    const row = db.prepare('SELECT * FROM applications WHERE id = 403').get();
    expect(row).toBeDefined();
  });
});
