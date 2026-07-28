import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from '../validators';
import { AuthService } from '../services/AuthService';
import { MemberRepository } from '../repositories/MemberRepository';
import { setCookie, deleteCookie } from 'hono/cookie';
import { successResponse, errorResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { hashPassword } from '../utils/password';

const router = new Hono<Env>();



router.post('/login', zValidator('json', loginSchema), async (c) => {
  const data = c.req.valid('json');
  const repo = new MemberRepository(c.env.DB);
  const service = new AuthService(repo, c.env.JWT_SECRET);
  
  const { user, token } = await service.login(data.name, data.password);
  
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  return c.json(successResponse(user, 'Logged in successfully'));
});

router.post('/logout', (c) => {
  deleteCookie(c, 'auth_token');
  return c.json(successResponse(null, 'Logged out successfully'));
});

router.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json(successResponse(user));
});

router.post('/setup', async (c) => {
    const repo = new MemberRepository(c.env.DB);
    
    // 1. Ensure the trip exists
    await c.env.DB.prepare(
      "INSERT OR IGNORE INTO Trips (id, name, currency) VALUES ('trip_1', 'Summer 2026', 'USD')"
    ).run();
  
    // 2. Hash the password using your local Cloudflare Worker environment
    const hash = await hashPassword('980121880');
  
    // 3. Insert or update Emad with the guaranteed correct hash
    await c.env.DB.prepare(`
      INSERT INTO Members (id, trip_id, name, password_hash, role) 
      VALUES ('mem_1', 'trip_1', 'Emad', ?, 'owner')
      ON CONFLICT(name) DO UPDATE SET password_hash = excluded.password_hash
    `).bind(hash).run();
  
    return c.json({ success: true, message: 'Database seeded! Try logging in now.' });
  });

export default router;