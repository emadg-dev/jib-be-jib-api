import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import tripRoutes from './routes/trip';
import memberRoutes from './routes/members';
import depositRoutes from './routes/deposits';
import withdrawalRoutes from './routes/withdrawals';
import dashboardRoutes from './routes/dashboard';
import profileRoutes from './routes/profile';
import notificationRoutes from './routes/notifications';
import docsRoutes from './routes/docs';
import telegramRoutes from './routes/telegram';


const app = new Hono<Env>().basePath('/api');

// Global Middleware
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        'http://localhost:4173',
        'http://localhost:3000',
        'https://jib-be-jib-web.pages.dev'
      ];

      return allowed.includes(origin) ? origin : '';
    },
    credentials: true,
    allowHeaders: [
      'Content-Type',
      'Authorization'
    ],
    allowMethods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS'
    ],
  })
);

app.onError(errorHandler);

// Routing
app.route('/docs', docsRoutes);
app.route('/auth', authRoutes);
app.route('/trip', tripRoutes);
app.route('/members', memberRoutes);
app.route('/deposits', depositRoutes);
app.route('/withdrawals', withdrawalRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/profile', profileRoutes);
app.route('/notifications', notificationRoutes);
app.route('/telegram', telegramRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;