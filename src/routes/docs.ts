import { Hono } from 'hono';
import { apiReference } from '@scalar/hono-api-reference';

const router = new Hono();

// The OpenAPI Specification object documenting our existing routes
const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Jib-be-Jib API',
    version: '1.0.0',
    description: 'API for Jib-be-Jib collaborative trip expense manager. Login selects a trip automatically when exactly one active trip is available; otherwise, call /trip/select before using trip-scoped endpoints.'
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
    '/trip/available': {
      get: {
        tags: ['Trips'],
        summary: 'List trips available to the authenticated member',
        responses: { '200': { description: 'Trips with role and active state' } }
      }
    },
    '/trip/select': {
      post: {
        tags: ['Trips'],
        summary: 'Select an active trip for the current session',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['trip_id'], properties: { trip_id: { type: 'string' } } } } }
        },
        responses: { '200': { description: 'Selected trip and replacement token' }, '403': { description: 'Trip is not an active membership' } }
      }
    },
    '/trip': {
      post: {
        tags: ['Trips'],
        summary: 'Create a trip and add the current member as its owner',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, currency: { type: 'string', example: 'USD' } } } } }
        },
        responses: { '201': { description: 'Trip created' } }
      }
    },
    '/trip/delete/{id}': {
      delete: {
        tags: ['Trips'],
        summary: 'Delete a trip (Owner only)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Trip ID'
          }
        ],
        responses: { '200': { description: 'Trip deleted' } }
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
    '/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get current user profile',
        responses: { '200': { description: 'User profile details' } }
      }
    },
    '/profile/password': {
      put: {
        tags: ['Profile'],
        summary: 'Change current user password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['current_password', 'new_password'],
                properties: {
                  current_password: { type: 'string' },
                  new_password: { type: 'string', minLength: 6 }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Password updated' }, '400': { description: 'Current password is incorrect' } }
      }
    },
    '/members': {
      get: {
        tags: ['Members'],
        summary: 'List members assigned to the selected trip (including inactive members)',
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
                  name: { type: 'string', description: 'Unique login username' },
                  display_name: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['owner', 'member'] },
                  active: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Member created' } }
      }
    },
    '/members/add': {
      post: {
        tags: ['Members'],
        summary: 'Add an existing account to the selected trip (Owner only)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['member_id'], properties: { member_id: { type: 'string' }, role: { type: 'string', enum: ['owner', 'member'] }, active: { type: 'boolean' } } } } }
        },
        responses: { '201': { description: 'Membership created or updated' } }
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
                  note: { type: 'string' },
                  date: { type: 'string', description: "ISO date (YYYY-MM-DD). Defaults to today if omitted" }
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
                  },
                  date: { type: 'string', description: "ISO date (YYYY-MM-DD). Defaults to today if omitted" }
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