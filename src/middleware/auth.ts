import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import { errorResponse } from '../utils/response';
import { Env } from '../types/env';

export const authMiddleware = async (c: Context<Env>, next: Next) => {
  const token = getCookie(c, 'auth_token');
  
  if (!token) {
    return c.json(errorResponse('Unauthorized'), 401);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    c.set('user', payload as any);
    await next();
  } catch (error) {
    return c.json(errorResponse('Invalid or expired token'), 401);
  }
};

export const requireOwner = async (c: Context<Env>, next: Next) => {
  const user = c.get('user');
  if (user.role !== 'owner') {
    return c.json(errorResponse('Forbidden: Requires owner role'), 403);
  }
  await next();
};