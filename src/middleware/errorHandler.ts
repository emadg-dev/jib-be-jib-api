import { Context } from 'hono';
import { errorResponse } from '../utils/response';
import { HTTPException } from 'hono/http-exception';

export const errorHandler = async (err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json(errorResponse(err.message), err.status);
  }
  console.error(err);
  return c.json(errorResponse('Internal Server Error'), 500);
};