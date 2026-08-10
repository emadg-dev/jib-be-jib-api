import { sign } from 'hono/jwt';
import { MemberRepository } from '../repositories/MemberRepository';
import { TripRepository } from '../repositories/TripRepository';
import { verifyPassword } from '../utils/password';
import { HTTPException } from 'hono/http-exception';

export class AuthService {
  constructor(
    private memberRepo: MemberRepository,
    private tripRepo: TripRepository,
    private jwtSecret: string
  ) {}

  async login(name: string, passwordAttempt: string) {
    const member = await this.memberRepo.findByName(name);
    if (!member || !await verifyPassword(passwordAttempt, member.password_hash as string)) {
      throw new HTTPException(401, { message: 'Invalid credentials' });
    }

    const isAdmin = member.role === 'admin';
    const trips = isAdmin
      ? await this.tripRepo.findAll()
      : await this.tripRepo.findActiveForMember(member.id as string);
    if (!trips.length) throw new HTTPException(403, { message: 'No active trips are available for this account' });

    const selectedTrip = trips.length === 1 ? trips[0] as { id: string; role: 'owner' | 'member' } : undefined;
    const token = await this.sign(member, selectedTrip, isAdmin);
    return {
      user: this.user(member, selectedTrip, isAdmin),
      trips,
      requires_trip_selection: !selectedTrip,
      token
    };
  }

  async selectTrip(memberId: string, tripId: string) {
    const member = await this.memberRepo.findById(memberId);
    if (!member) throw new HTTPException(404, { message: 'Member not found' });
    const isAdmin = (member as any)?.role === 'admin';

    if (!isAdmin) {
      const membership = await this.tripRepo.findMembership(memberId, tripId) as { role: 'owner' | 'member'; active: number } | null;
      if (!membership || !membership.active) {
        throw new HTTPException(403, { message: 'You do not have an active membership in this trip' });
      }
      const token = await this.sign(member, { id: tripId, role: membership.role });
      return { user: this.user(member, { id: tripId, role: membership.role }), token };
    }

    const token = await this.sign(member, { id: tripId, role: 'admin' as const }, true);
    return { user: this.user(member, { id: tripId, role: 'admin' as const }, true), token };
  }

  private user(member: Record<string, unknown>, trip?: { id: string; role: 'owner' | 'member' | 'admin' }, isAdmin = false) {
    let preferences: Record<string, boolean> | undefined;
    if (member.preferences) {
      try { preferences = JSON.parse(member.preferences as string); } catch { preferences = undefined; }
    }
    return {
      id: member.id as string,
      name: member.name as string,
      display_name: (member.display_name || member.name) as string,
      role: isAdmin ? 'admin' as const : trip?.role,
      trip_id: trip?.id,
      preferences,
      avatar: (member.avatar as string) || undefined
    };
  }

  private async sign(member: Record<string, unknown>, trip?: { id: string; role: 'owner' | 'member' | 'admin' }, isAdmin = false) {
    return sign({
      id: member.id as string,
      name: member.name as string,
      display_name: (member.display_name || member.name) as string,
      role: isAdmin ? 'admin' as const : trip?.role,
      trip_id: trip?.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    }, this.jwtSecret, 'HS256');
  }
}
