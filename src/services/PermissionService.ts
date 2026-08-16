import { PermissionRepository, StoredPermission } from '../repositories/PermissionRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { PermissionKey, ROLE_DEFAULTS, PERMISSIONS } from '../config/permissions';

export class PermissionService {
  constructor(
    private repo: PermissionRepository,
    private roleRepo: RoleRepository
  ) {}

  async hasPermission(memberId: string, tripId: string, permission: PermissionKey, role: string): Promise<boolean> {
    if (role === 'admin' || role === 'owner') return true;
    const perms = await this.getEffectivePermissions(memberId, tripId, role);
    return perms.includes(permission);
  }

  async getEffectivePermissions(memberId: string, tripId: string, role: string): Promise<PermissionKey[]> {
    if (role === 'admin' || role === 'owner') {
      return PERMISSIONS.map(p => p.key);
    }

    const basePermissions = await this.getBasePermissions(memberId, tripId, role);
    const overrides = await this.repo.getMemberPermissions(memberId, tripId);
    const denied = new Set(overrides.filter(o => o.effect === 'deny').map(o => o.permission));
    const allowed = new Set(overrides.filter(o => o.effect === 'allow').map(o => o.permission));

    return PERMISSIONS
      .map(p => p.key)
      .filter(key => {
        if (denied.has(key)) return false;
        if (allowed.has(key)) return true;
        return basePermissions.has(key);
      });
  }

  private async getBasePermissions(memberId: string, tripId: string, role: string): Promise<Set<PermissionKey>> {
    const customRoleId = await this.repo.getCustomRoleId(memberId, tripId);

    if (customRoleId) {
      const rolePerms = await this.roleRepo.getPermissions(customRoleId);
      if (rolePerms.length > 0) {
        return new Set(rolePerms as PermissionKey[]);
      }
    }

    const defaults = ROLE_DEFAULTS[role];
    if (defaults?.all) return new Set(PERMISSIONS.map(p => p.key));
    return new Set(defaults?.allow ?? []);
  }

  async setMemberPermissions(memberId: string, tripId: string, grants: { permission: PermissionKey; effect: 'allow' | 'deny' }[], grantedBy: string): Promise<void> {
    await this.repo.setMemberPermissions(memberId, tripId, grants, grantedBy);
  }

  async grantPermission(memberId: string, tripId: string, permission: PermissionKey, effect: 'allow' | 'deny', grantedBy: string): Promise<void> {
    await this.repo.grantPermission(memberId, tripId, permission, effect, grantedBy);
  }

  async revokePermission(memberId: string, tripId: string, permission: PermissionKey): Promise<void> {
    await this.repo.revokePermission(memberId, tripId, permission);
  }

  async getAllTripPermissions(tripId: string) {
    return this.repo.getAllTripPermissions(tripId);
  }

  async setMemberRole(memberId: string, tripId: string, customRoleId: string | null): Promise<void> {
    await this.repo.setCustomRoleId(memberId, tripId, customRoleId);
  }
}
