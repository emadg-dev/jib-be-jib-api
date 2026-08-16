import { RoleRepository } from '../repositories/RoleRepository';
import { PermissionKey } from '../config/permissions';

export class RoleService {
  constructor(private repo: RoleRepository) {}

  async getRoles(tripId: string) {
    return this.repo.findAll(tripId);
  }

  async getRole(roleId: string) {
    const role = await this.repo.findById(roleId);
    if (!role) throw 404;
    const permissions = await this.repo.getPermissions(roleId);
    return { ...role, permissions };
  }

  async createRole(tripId: string, name: string, description: string | null) {
    if (await this.repo.isNameTaken(tripId, name)) throw 409;
    const id = `role_${crypto.randomUUID()}`;
    return this.repo.create(id, tripId, name, description);
  }

  async updateRole(roleId: string, name: string, description: string | null) {
    const role = await this.repo.findById(roleId);
    if (!role) throw 404;
    if (role.is_default) throw 400;
    if (await this.repo.isNameTaken(role.trip_id, name, roleId)) throw 409;
    await this.repo.update(roleId, name, description);
  }

  async deleteRole(roleId: string) {
    const role = await this.repo.findById(roleId);
    if (!role) throw 404;
    if (role.is_default) throw 400;
    const count = await this.repo.countMembersWithRole(roleId);
    if (count > 0) throw 409;
    await this.repo.delete(roleId);
  }

  async setRolePermissions(roleId: string, permissions: PermissionKey[]) {
    const role = await this.repo.findById(roleId);
    if (!role) throw 404;
    await this.repo.setPermissions(roleId, permissions);
  }

  async getAllRolePermissions(tripId: string) {
    const roles = await this.repo.findAll(tripId);
    const result: Record<string, string[]> = {};
    for (const role of roles) {
      result[role.id] = await this.repo.getPermissions(role.id);
    }
    return result;
  }
}
