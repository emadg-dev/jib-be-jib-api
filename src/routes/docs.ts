import { Hono } from 'hono';
import { apiReference } from '@scalar/hono-api-reference';

const router = new Hono();

// The OpenAPI Specification object documenting our existing routes
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Jib-be-Jib API',
    version: '1.0.0',
    description: 'API for Jib-be-Jib collaborative trip expense manager.',
  },
  servers: [
    {
      url: '/api',
      description: 'Local Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_token',
      },
    },
  },
  security: [
    { cookieAuth: [] }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health Check',
        security: [], // No auth required
        responses: {
          '200': { description: 'System is healthy' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login to the application',
        security: [], // No auth required to login
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Emad' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Successful login (sets HttpOnly cookie)' }
        }
      }
    },
    '/auth/setup': {
      post: {
        tags: ['Authentication'],
        summary: 'Seed the database and create owner account (Emad)',
        security: [], // No auth required
        responses: {
          '200': { description: 'Database successfully seeded' }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout',
        responses: { '200': { description: 'Logged out successfully' } }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        responses: { '200': { description: 'Returns current authenticated user details' } }
      }
    },
    '/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        description: 'Returns bank balance, totals, member stats, and settlements',
        responses: { '200': { description: 'Dashboard data' } }
      }
    },
    '/members': {
      get: {
        tags: ['Members'],
        summary: 'List all members',
        responses: { '200': { description: 'Array of members' } }
      },
      post: {
        tags: ['Members'],
        summary: 'Create a new member (Owner only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['owner', 'member'] }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Member created' } }
      }
    },
    '/deposits': {
      get: {
        tags: ['Deposits'],
        summary: 'List all deposits',
        responses: { '200': { description: 'Array of deposits' } }
      },
      post: {
        tags: ['Deposits'],
        summary: 'Add a new deposit',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  member_id: { type: 'string' },
                  amount: { type: 'number' },
                  note: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Deposit created' } }
      }
    },
    '/withdrawals': {
      get: {
        tags: ['Withdrawals'],
        summary: 'List all withdrawals',
        responses: { '200': { description: 'Array of withdrawals with beneficiaries' } }
      },
      post: {
        tags: ['Withdrawals'],
        summary: 'Add a new withdrawal (expense)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  description: { type: 'string', example: 'Dinner' },
                  category: { type: 'string', example: 'Food' },
                  amount: { type: 'number', example: 120 },
                  beneficiaries: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        member_id: { type: 'string' },
                        share: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Withdrawal created' } }
      }
    }
  }
};

// 1. Serve the raw JSON spec
router.get('/openapi.json', (c) => c.json(openApiSpec));

// 2. Serve the Scalar UI dashboard
router.get(
  '/',
  apiReference({
    pageTitle: 'Jib-be-Jib API Reference',
    spec: {
      url: '/api/docs/openapi.json',
    },
    theme: 'kepler', // Try 'purple', 'moon', 'saturn' for different dark mode vibes
  })
);

export default router;