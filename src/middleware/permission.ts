import { Context, Next } from 'hono';
import { errorResponse } from '../utils/response';
import { Env } from '../types/env';
import { PermissionKey } from '../config/permissions';
import { PermissionService } from '../services/PermissionService';
import { PermissionRepository } from '../repositories/PermissionRepository';
import { RoleRepository } from '../repositories/RoleRepository';

export const requirePermission = (permission: PermissionKey) => {
  return async (c: Context<Env>, next: Next) => {
    const user = c.get('user');

    if (user.role === 'admin') return next();

    const tripId = user.trip_id;
    if (!tripId) return c.json(errorResponse('Select a trip before continuing'), 409);

    if (user.role === 'owner') {
      const repo = new PermissionRepository(c.env.DB);
      const isMember = await repo.isMemberInTrip(user.id, tripId);
      if (!isMember) return c.json(errorResponse('Forbidden: Not a member of this trip'), 403);
      return next();
    }

    const service = new PermissionService(new PermissionRepository(c.env.DB), new RoleRepository(c.env.DB));
    const hasPermission = await service.hasPermission(user.id, tripId, permission, user.role ?? 'member');
    if (!hasPermission) return c.json(errorResponse('Forbidden: Insufficient permissions'), 403);

    await next();
  };
};
