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
import docsRoutes from './routes/docs';

const app = new Hono<Env>().basePath('/api');

// Global Middleware
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}));

app.onError(errorHandler);

// Routing
app.route('/docs', docsRoutes);
app.route('/auth', authRoutes);
app.route('/trip', tripRoutes);
app.route('/members', memberRoutes);
app.route('/deposits', depositRoutes);
app.route('/withdrawals', withdrawalRoutes);
app.route('/dashboard', dashboardRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;