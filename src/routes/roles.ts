import { Hono } from 'hono';
import { Env } from '../types/env';
import { authMiddleware, requireActiveTrip } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { successResponse } from '../utils/response';
import { RoleService } from '../services/RoleService';
import { RoleRepository } from '../repositories/RoleRepository';
import { isValidPermission, PermissionKey } from '../config/permissions';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);

const tripId = (c: any) => c.get('user').trip_id!;
const service = (c: any) => new RoleService(new RoleRepository(c.env.DB));

router.get('/', requirePermission('roles.manage'), async (c) => {
  const roles = await service(c).getRoles(tripId(c));
  return c.json(successResponse(roles));
});

router.get('/permissions', requirePermission('roles.manage'), async (c) => {
  const perms = await service(c).getAllRolePermissions(tripId(c));
  return c.json(successResponse(perms));
});

router.get('/:roleId', requirePermission('roles.manage'), async (c) => {
  try {
    const role = await service(c).getRole(String(c.req.param('roleId')));
    return c.json(successResponse(role));
  } catch (e) {
    if (e === 404) return c.json({ success: false, message: 'Role not found' }, 404);
    throw e;
  }
});

const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional().nullable(),
  permissions: z.array(z.string()).optional(),
});

router.post('/', requirePermission('roles.manage'), zValidator('json', createRoleSchema), async (c) => {
  const { name, description, permissions } = c.req.valid('json');
  const svc = service(c);
  try {
    const role = await svc.createRole(tripId(c), name, description || null);
    if (permissions?.length) {
      const validPerms = permissions.filter(p => isValidPermission(p)) as PermissionKey[];
      await svc.setRolePermissions(role.id, validPerms);
    }
    const full = await svc.getRole(role.id);
    return c.json(successResponse(full), 201);
  } catch (e) {
    if (e === 409) return c.json({ success: false, message: 'Role name already taken' }, 409);
    throw e;
  }
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  permissions: z.array(z.string()).optional(),
});

router.put('/:roleId', requirePermission('roles.manage'), zValidator('json', updateRoleSchema), async (c) => {
  const roleId = String(c.req.param('roleId'));
  const { name, description, permissions } = c.req.valid('json');
  const svc = service(c);
  try {
    const existing = await svc.getRole(roleId);
    if (name || description !== undefined) {
      await svc.updateRole(roleId, name || existing.name, description !== undefined ? description : existing.description);
    }
    if (permissions !== undefined) {
      const validPerms = permissions.filter(p => isValidPermission(p)) as PermissionKey[];
      await svc.setRolePermissions(roleId, validPerms);
    }
    const full = await svc.getRole(roleId);
    return c.json(successResponse(full));
  } catch (e) {
    if (e === 404) return c.json({ success: false, message: 'Role not found' }, 404);
    if (e === 400) return c.json({ success: false, message: 'Cannot modify default role' }, 400);
    if (e === 409) return c.json({ success: false, message: 'Role name already taken' }, 409);
    throw e;
  }
});

router.delete('/:roleId', requirePermission('roles.manage'), async (c) => {
  const roleId = String(c.req.param('roleId'));
  const svc = service(c);
  try {
    await svc.deleteRole(roleId);
    return c.json(successResponse(null, 'Role deleted'));
  } catch (e) {
    if (e === 404) return c.json({ success: false, message: 'Role not found' }, 404);
    if (e === 400) return c.json({ success: false, message: 'Cannot delete default role' }, 400);
    if (e === 409) return c.json({ success: false, message: 'Cannot delete role assigned to members' }, 409);
    throw e;
  }
});

export default router;
