import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { changePasswordSchema } from '../validators';
import { MemberRepository } from '../repositories/MemberRepository';
import { successResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { verifyPassword, hashPassword } from '../utils/password';
import { HTTPException } from 'hono/http-exception';

const router = new Hono<Env>();
router.use('*', authMiddleware);
const getRepo = (c: any) => new MemberRepository(c.env.DB);

router.get('/', async (c) => {
  const user = c.get('user');
  const member = await getRepo(c).findById(user.id);
  return c.json(successResponse(member));
});

router.put('/password', zValidator('json', changePasswordSchema), async (c) => {
  const user = c.get('user');
  const { current_password, new_password } = c.req.valid('json');

  const member = await getRepo(c).findFullById(user.id);
  if (!member) throw new HTTPException(404, { message: 'User not found' });

  if (!await verifyPassword(current_password, member.password_hash as string)) {
    throw new HTTPException(400, { message: 'Current password is incorrect' });
  }

  const hash = await hashPassword(new_password);
  await getRepo(c).updatePassword(user.id, hash);
  return c.json(successResponse(null, 'Password updated'));
});

export default router;
