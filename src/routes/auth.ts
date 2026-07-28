import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '../validators';
import { AuthService } from '../services/AuthService';
import { MemberRepository } from '../repositories/MemberRepository';
import { TripRepository } from '../repositories/TripRepository';
import { setCookie, deleteCookie } from 'hono/cookie';
import { successResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { hashPassword } from '../utils/password';

const router = new Hono<Env>();
const service = (c: any) => new AuthService(new MemberRepository(c.env.DB), new TripRepository(c.env.DB), c.env.JWT_SECRET);
const setAuthCookie = (c: any, token: string) => setCookie(c, 'auth_token', token, {
  httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 7
});

router.post('/login', zValidator('json', loginSchema), async (c) => {
  const result = await service(c).login(c.req.valid('json').name, c.req.valid('json').password);
  setAuthCookie(c, result.token);
  return c.json(successResponse(result, 'Logged in successfully'));
});

router.post('/logout', (c) => {
  deleteCookie(c, 'auth_token');
  return c.json(successResponse(null, 'Logged out successfully'));
});

router.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json(successResponse({ user, trips: await new TripRepository(c.env.DB).findForMember(user.id) }));
});

// Development-only bootstrap retained for the existing local setup workflow.
router.post('/setup', async (c) => {
  const hash = await hashPassword('980121880');
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT OR IGNORE INTO Trips (id, name, currency) VALUES ('trip_1', 'Summer 2026', 'USD')"),
    c.env.DB.prepare(`
      INSERT INTO Members (id, trip_id, name, password_hash, role, display_name)
      VALUES ('mem_1', 'trip_1', 'Emad', ?, 'owner', 'Emad')
      ON CONFLICT(name) DO UPDATE SET password_hash = excluded.password_hash, display_name = excluded.display_name
    `).bind(hash),
    c.env.DB.prepare("INSERT OR IGNORE INTO MemberTrips (member_id, trip_id, role, active) VALUES ('mem_1', 'trip_1', 'owner', 1)")
  ]);
  return c.json(successResponse(null, 'Database seeded'));
});

export default router;
