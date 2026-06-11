import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'volunteer.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'volunteer' CHECK(role IN ('volunteer', 'organizer', 'admin')),
      phone TEXT DEFAULT '',
      id_card TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS events (
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

    CREATE TABLE IF NOT EXISTS positions (
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

    CREATE TABLE IF NOT EXISTS applications (
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

    CREATE TABLE IF NOT EXISTS schedules (
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

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      checkin_time TEXT NOT NULL,
      checkout_time TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (position_id) REFERENCES positions(id)
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      comment TEXT DEFAULT '',
      certificate_url TEXT DEFAULT '',
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
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

  seedData();
}

function seedData(): void {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (adminExists) return;

  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO users (username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)'
  ).run('admin', 'admin@marathon.com', adminHash, 'admin', '13800000000');

  const orgHash = bcrypt.hashSync('org123', 10);
  db.prepare(
    'INSERT INTO users (username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)'
  ).run('organizer1', 'org@marathon.com', orgHash, 'organizer', '13800000001');

  const volHash = bcrypt.hashSync('vol123', 10);
  db.prepare(
    'INSERT INTO users (username, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)'
  ).run('volunteer1', 'vol@marathon.com', volHash, 'volunteer', '13800000002');

  db.prepare(
    `INSERT INTO events (organizer_id, name, city, date, description, status) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    2,
    '2026北京国际马拉松',
    '北京',
    '2026-10-18',
    '2026年北京国际马拉松赛事，全程42.195公里，途经天安门、鸟巢等地标建筑。诚邀志愿者加入！',
    'recruiting'
  );

  const positions = [
    ['补给站志愿者', '负责在补给站为选手提供水、运动饮料、能量食品等补给物资，保持补给站整洁有序。', 20, '06:00', '14:00', '5km/10km/15km补给站'],
    ['赛道指引志愿者', '在赛道关键节点和路口为选手指引方向，确保选手跑在正确路线上，防止迷路。', 15, '06:00', '15:00', '各关键路口'],
    ['医疗急救志愿者', '在医疗站点协助医护人员处理选手伤病，具备基本急救知识，能快速响应突发状况。', 10, '06:00', '16:00', '各医疗站'],
    ['计时服务志愿者', '负责在起终点和分段计时点操作计时设备，记录选手成绩，确保数据准确。', 8, '05:30', '15:00', '起点/终点/各计时点'],
    ['物资发放志愿者', '负责赛前物资包发放和赛后奖牌、完赛包发放，核验选手身份。', 12, '08:00', '18:00', '物资发放区'],
  ];

  const insertPos = db.prepare(
    'INSERT INTO positions (event_id, name, description, people_needed, time_start, time_end, location_point) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  for (const pos of positions) {
    insertPos.run(1, pos[0], pos[1], pos[2], pos[3], pos[4], pos[5]);
  }
}

export default db;
