import { Hono } from 'hono';
import { Env } from '../types/env';
import { authMiddleware, requireActiveTrip } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import { successResponse } from '../utils/response';
import { PermissionService } from '../services/PermissionService';
import { PermissionRepository } from '../repositories/PermissionRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { PERMISSIONS, PERMISSION_GROUPS, isValidPermission, PermissionKey } from '../config/permissions';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);

const tripId = (c: any) => c.get('user').trip_id!;
const service = (c: any) => new PermissionService(new PermissionRepository(c.env.DB), new RoleRepository(c.env.DB));

router.get('/', requirePermission('permissions.manage'), async (c) => {
  const svc = service(c);
  const allPerms = await svc.getAllTripPermissions(tripId(c));
  const grouped: Record<string, Record<string, { permission: string; effect: string }[]>> = {};
  for (const p of allPerms) {
    if (!grouped[p.member_id]) grouped[p.member_id] = {};
    if (!grouped[p.member_id][p.permission]) grouped[p.member_id][p.permission] = [];
    grouped[p.member_id][p.permission].push({ permission: p.permission, effect: p.effect });
  }
  return c.json(successResponse(grouped));
});

router.get('/registry', async (c) => {
  return c.json(successResponse({ permissions: PERMISSIONS, groups: PERMISSION_GROUPS }));
});

router.get('/:memberId', requirePermission('permissions.manage'), async (c) => {
  const memberId = String(c.req.param('memberId'));
  const svc = service(c);
  const perms = await svc.getEffectivePermissions(memberId, tripId(c), 'member');
  const overrides = await new PermissionRepository(c.env.DB).getMemberPermissions(memberId, tripId(c));
  const customRoleId = await new PermissionRepository(c.env.DB).getCustomRoleId(memberId, tripId(c));
  return c.json(successResponse({ effective: perms, overrides, customRoleId }));
});

const setPermissionsSchema = z.object({
  grants: z.array(z.object({
    permission: z.string(),
    effect: z.enum(['allow', 'deny']),
  })),
});

router.put('/:memberId', requirePermission('permissions.manage'), zValidator('json', setPermissionsSchema), async (c) => {
  const memberId = String(c.req.param('memberId'));
  const { grants } = c.req.valid('json');
  const user = c.get('user');

  const validGrants = grants
    .filter(g => isValidPermission(g.permission))
    .map(g => ({ permission: g.permission as PermissionKey, effect: g.effect as 'allow' | 'deny' }));

  const svc = service(c);
  await svc.setMemberPermissions(memberId, tripId(c), validGrants, user.id);
  return c.json(successResponse(null, 'Permissions updated'));
});

const grantSchema = z.object({
  effect: z.enum(['allow', 'deny']).default('allow'),
});

router.post('/:memberId/:permission', requirePermission('permissions.manage'), zValidator('json', grantSchema), async (c) => {
  const memberId = String(c.req.param('memberId'));
  const permission = String(c.req.param('permission'));
  const user = c.get('user');

  if (!isValidPermission(permission)) return c.json({ success: false, message: 'Invalid permission' }, 400);

  const svc = service(c);
  await svc.grantPermission(memberId, tripId(c), permission, c.req.valid('json').effect, user.id);
  return c.json(successResponse(null, 'Permission granted'));
});

router.delete('/:memberId/:permission', requirePermission('permissions.manage'), async (c) => {
  const memberId = String(c.req.param('memberId'));
  const permission = String(c.req.param('permission'));

  if (!isValidPermission(permission)) return c.json({ success: false, message: 'Invalid permission' }, 400);

  const svc = service(c);
  await svc.revokePermission(memberId, tripId(c), permission);
  return c.json(successResponse(null, 'Permission revoked'));
});

const assignRoleSchema = z.object({
  customRoleId: z.string().nullable(),
});

router.put('/:memberId/role', requirePermission('permissions.manage'), zValidator('json', assignRoleSchema), async (c) => {
  const memberId = String(c.req.param('memberId'));
  const { customRoleId } = c.req.valid('json');
  const svc = service(c);
  await svc.setMemberRole(memberId, tripId(c), customRoleId);
  return c.json(successResponse(null, 'Role assigned'));
});

export default router;
