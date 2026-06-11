import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './db';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import positionRoutes from './routes/positions';
import applicationRoutes from './routes/applications';
import scheduleRoutes from './routes/schedules';
import checkinRoutes from './routes/checkin';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();
console.log('Database initialized');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Marathon Volunteer Management Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
