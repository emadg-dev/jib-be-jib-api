import { Hono } from 'hono';
import { Env } from '../types/env';
import { zValidator } from '@hono/zod-validator';
import { depositSchema } from '../validators';
import { DepositRepository } from '../repositories/DepositRepository';
import { DepositService } from '../services/TripService';
import { successResponse } from '../utils/response';
import { authMiddleware, requireActiveTrip, requireOwner } from '../middleware/auth';

const router = new Hono<Env>();
router.use('*', authMiddleware, requireActiveTrip);
const service = (c: any) => new DepositService(new DepositRepository(c.env.DB));
const tripId = (c: any) => c.get('user').trip_id!;
router.get('/', async (c) => c.json(successResponse(await service(c).getDeposits(tripId(c)))));
router.post('/', requireOwner, zValidator('json', depositSchema), async (c) => c.json(successResponse(await service(c).createDeposit(tripId(c), c.req.valid('json'))), 201));
router.put('/:id', requireOwner, zValidator('json', depositSchema), async (c) => c.json(successResponse(await service(c).updateDeposit(c.req.param('id'), tripId(c), c.req.valid('json')))));
router.delete('/:id', requireOwner, async (c) => { await service(c).deleteDeposit(String(c.req.param('id')), tripId(c)); return c.json(successResponse(null, 'Deleted')); });
export default router;
