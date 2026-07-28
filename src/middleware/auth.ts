import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { errorResponse } from '../utils/response';
import { Env } from '../types/env';

export const authMiddleware = async (c: Context<Env>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : getCookie(c, 'auth_token');

  if (!token) return c.json(errorResponse('Unauthorized'), 401);

  try {
    c.set('user', await verify(token, c.env.JWT_SECRET, 'HS256') as unknown as Env['Variables']['user']);
    await next();
  } catch {
    return c.json(errorResponse('Invalid or expired token'), 401);
  }
};

export const requireActiveTrip = async (c: Context<Env>, next: Next) => {
  const user = c.get('user');
  if (!user.trip_id) return c.json(errorResponse('Select a trip before continuing'), 409);

  const membership = await c.env.DB.prepare(
    'SELECT role FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1'
  ).bind(user.id, user.trip_id).first<{ role: 'owner' | 'member' }>();

  if (!membership) return c.json(errorResponse('Your membership in this trip is inactive or unavailable'), 403);
  c.set('user', { ...user, role: membership.role });
  await next();
};

export const requireOwner = async (c: Context<Env>, next: Next) => {
  const user = c.get('user');
  if (user.role !== 'owner') return c.json(errorResponse('Forbidden: Requires owner role'), 403);
  await next();
};
