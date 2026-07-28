import { sign } from 'hono/jwt';
import { MemberRepository } from '../repositories/MemberRepository';
import { verifyPassword } from '../utils/password';
import { HTTPException } from 'hono/http-exception';

export class AuthService {
  constructor(private memberRepo: MemberRepository, private jwtSecret: string) {}

  async login(name: string, passwordAttempt: string) {
    const user = await this.memberRepo.findByName(name);
    if (!user) throw new HTTPException(401, { message: 'Invalid credentials' });

    const isValid = await verifyPassword(passwordAttempt, user.password_hash as string);
    if (!isValid) throw new HTTPException(401, { message: 'Invalid credentials' });

    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      trip_id: user.trip_id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
    };

    const token = await sign(payload, this.jwtSecret, 'HS256');
    return { user: { id: user.id, name: user.name, role: user.role }, token };
  }
}