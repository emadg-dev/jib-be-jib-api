import { PermissionKey } from '../config/permissions';

export interface TripRole {
  id: string;
  trip_id: string;
  name: string;
  description: string | null;
  is_default: number;
  created_at: string;
}

export interface TripRolePermission {
  role_id: string;
  permission: string;
}

export class RoleRepository {
  constructor(private db: D1Database) {}

  async findAll(tripId: string): Promise<TripRole[]> {
    const results = await this.db.prepare(
      'SELECT id, trip_id, name, description, is_default, created_at FROM TripRoles WHERE trip_id = ? ORDER BY name'
    ).bind(tripId).all<TripRole>();
    return results.results;
  }

  async findById(roleId: string): Promise<TripRole | null> {
    return this.db.prepare(
      'SELECT id, trip_id, name, description, is_default, created_at FROM TripRoles WHERE id = ?'
    ).bind(roleId).first<TripRole>();
  }

  async create(id: string, tripId: string, name: string, description: string | null): Promise<TripRole> {
    await this.db.prepare(
      'INSERT INTO TripRoles (id, trip_id, name, description) VALUES (?, ?, ?, ?)'
    ).bind(id, tripId, name, description).run();
    return (await this.findById(id))!;
  }

  async update(id: string, name: string, description: string | null): Promise<void> {
    await this.db.prepare(
      'UPDATE TripRoles SET name = ?, description = ? WHERE id = ?'
    ).bind(name, description, id).run();
  }

  async delete(id: string): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM TripRolePermissions WHERE role_id = ?').bind(id),
      this.db.prepare('DELETE FROM TripRoles WHERE id = ?').bind(id),
    ]);
  }

  async getPermissions(roleId: string): Promise<string[]> {
    const results = await this.db.prepare(
      'SELECT permission FROM TripRolePermissions WHERE role_id = ?'
    ).bind(roleId).all<{ permission: string }>();
    return results.results.map(r => r.permission);
  }

  async setPermissions(roleId: string, permissions: PermissionKey[]): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM TripRolePermissions WHERE role_id = ?').bind(roleId),
      ...permissions.map(p =>
        this.db.prepare('INSERT INTO TripRolePermissions (role_id, permission) VALUES (?, ?)').bind(roleId, p)
      ),
    ]);
  }

  async isNameTaken(tripId: string, name: string, excludeRoleId?: string): Promise<boolean> {
    let sql = 'SELECT 1 FROM TripRoles WHERE trip_id = ? AND LOWER(name) = LOWER(?)';
    const params: any[] = [tripId, name];
    if (excludeRoleId) {
      sql += ' AND id != ?';
      params.push(excludeRoleId);
    }
    const row = await this.db.prepare(sql).bind(...params).first();
    return !!row;
  }

  async countMembersWithRole(roleId: string): Promise<number> {
    const row = await this.db.prepare(
      'SELECT COUNT(*) as count FROM MemberTrips WHERE custom_role_id = ?'
    ).bind(roleId).first<{ count: number }>();
    return row?.count ?? 0;
  }
}
