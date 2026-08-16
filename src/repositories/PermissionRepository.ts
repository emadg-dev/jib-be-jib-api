import { PermissionKey } from '../config/permissions';

export interface StoredPermission {
  permission: string;
  effect: 'allow' | 'deny';
}

export class PermissionRepository {
  constructor(private db: D1Database) {}

  async getMemberPermissions(memberId: string, tripId: string): Promise<StoredPermission[]> {
    const results = await this.db.prepare(
      'SELECT permission, effect FROM TripMemberPermissions WHERE member_id = ? AND trip_id = ?'
    ).bind(memberId, tripId).all<StoredPermission>();
    return results.results;
  }

  async getAllTripPermissions(tripId: string): Promise<(StoredPermission & { member_id: string })[]> {
    const results = await this.db.prepare(
      'SELECT member_id, permission, effect FROM TripMemberPermissions WHERE trip_id = ?'
    ).bind(tripId).all<StoredPermission & { member_id: string }>();
    return results.results;
  }

  async setMemberPermissions(memberId: string, tripId: string, grants: { permission: PermissionKey; effect: 'allow' | 'deny' }[], grantedBy: string): Promise<void> {
    const statements = [
      this.db.prepare('DELETE FROM TripMemberPermissions WHERE member_id = ? AND trip_id = ?')
        .bind(memberId, tripId),
      ...grants.map(g =>
        this.db.prepare(
          'INSERT INTO TripMemberPermissions (member_id, trip_id, permission, effect, granted_by) VALUES (?, ?, ?, ?, ?)'
        ).bind(memberId, tripId, g.permission, g.effect, grantedBy)
      )
    ];
    await this.db.batch(statements);
  }

  async grantPermission(memberId: string, tripId: string, permission: PermissionKey, effect: 'allow' | 'deny', grantedBy: string): Promise<void> {
    await this.db.prepare(
      'INSERT INTO TripMemberPermissions (member_id, trip_id, permission, effect, granted_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT(member_id, trip_id, permission) DO UPDATE SET effect = excluded.effect, granted_by = excluded.granted_by'
    ).bind(memberId, tripId, permission, effect, grantedBy).run();
  }

  async revokePermission(memberId: string, tripId: string, permission: PermissionKey): Promise<void> {
    await this.db.prepare(
      'DELETE FROM TripMemberPermissions WHERE member_id = ? AND trip_id = ? AND permission = ?'
    ).bind(memberId, tripId, permission).run();
  }

  async isMemberInTrip(memberId: string, tripId: string): Promise<boolean> {
    const row = await this.db.prepare(
      'SELECT 1 FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1'
    ).bind(memberId, tripId).first();
    return !!row;
  }

  async getMemberTripRole(memberId: string, tripId: string): Promise<string | null> {
    const row = await this.db.prepare(
      'SELECT role FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1'
    ).bind(memberId, tripId).first<{ role: string }>();
    return row?.role ?? null;
  }

  async getCustomRoleId(memberId: string, tripId: string): Promise<string | null> {
    const row = await this.db.prepare(
      'SELECT custom_role_id FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1'
    ).bind(memberId, tripId).first<{ custom_role_id: string | null }>();
    return row?.custom_role_id ?? null;
  }

  async setCustomRoleId(memberId: string, tripId: string, customRoleId: string | null): Promise<void> {
    await this.db.prepare(
      'UPDATE MemberTrips SET custom_role_id = ? WHERE member_id = ? AND trip_id = ?'
    ).bind(customRoleId, memberId, tripId).run();
  }
}
