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
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'API_SECRET for Telegram bot endpoints',
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
        summary: 'Seed the database auth',
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
      get: {
        tags: ['Trips'],
        summary: 'Get the current active trip',
        responses: { '200': { description: 'Current trip details' } }
      },
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
    '/trip/{id}': {
      put: {
        tags: ['Trips'],
        summary: 'Update a trip by ID (Owner of that trip only)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Trip ID'
          }
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, currency: { type: 'string', example: 'EUR' } } } } }
        },
        responses: { '200': { description: 'Trip updated' }, '403': { description: 'Requires owner role in this trip' } }
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
    '/profile/preferences': {
      put: {
        tags: ['Profile'],
        summary: 'Update current user preferences',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'User preference settings',
                additionalProperties: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Preferences updated'
          }
        }
      }
    },

    '/profile/avatar': {
      put: {
        tags: ['Profile'],
        summary: 'Update current user avatar',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: {
                    type: 'string',
                    description: 'Avatar URL or base64 encoded image data'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Avatar updated'
          },
          '400': {
            description: 'Invalid avatar data'
          }
        }
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
    },
    '/notifications/telegram': {
      post: {
        tags: ['Notifications'],
        summary: 'Forward a notification to the configured Telegram webhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['event', 'title', 'message'],
                properties: {
                  event: { type: 'string', enum: ['trip_created', 'trip_updated', 'member_added', 'deposit_created', 'expense_created'], example: 'member_added' },
                  title: { type: 'string', example: 'New member added' },
                  message: { type: 'string', example: 'Ali joined the trip' },
                  metadata: { type: 'object', additionalProperties: true }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Notification forwarded (or skipped when disabled)' },
          '401': { description: 'Unauthenticated' }
        }
      }
    },
    '/notifications/telegram/test': {
      post: {
        tags: ['Notifications'],
        summary: 'Send a raw test message to a Telegram chat ID',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['chat_id', 'message'],
                properties: {
                  chat_id: { type: 'string', example: '-1001234567890' },
                  title: { type: 'string', example: 'Test notification' },
                  message: { type: 'string', example: 'This is a test message' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Test notification sent (delivered: true/false in data)' },
          '401': { description: 'Unauthenticated' }
        }
      }
    },
    '/notifications/settings': {
      get: {
        tags: ['Notifications'],
        summary: 'Get Telegram notification settings for the selected trip',
        responses: {
          '200': {
            description: 'Current Telegram settings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    telegram_enabled: { type: 'boolean', example: true },
                    telegram_chat_id: { type: 'string', nullable: true },
                    events: {
                      type: 'object',
                      additionalProperties: {
                        type: 'object',
                        properties: {
                          enabled: { type: 'boolean' },
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthenticated' },
          '409': { description: 'No trip selected' }
        }
      },
      put: {
        tags: ['Notifications'],
        summary: 'Update Telegram notification settings for the selected trip (Owner only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telegram_enabled'],
                properties: {
                  telegram_enabled: { type: 'boolean' },
                  telegram_chat_id: { type: 'string', description: 'Leave empty to clear' },
                  events: {
                    type: 'object',
                    description: 'Partial per-event overrides',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        enabled: { type: 'boolean' },
                        message: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Updated Telegram settings' },
          '403': { description: 'Requires owner role' },
          '401': { description: 'Unauthenticated' },
          '409': { description: 'No trip selected' }
        }
      }
    },
    '/ratings/ratees': {
      get: {
        tags: ['Ratings'],
        summary: 'List members to rate with existing scores',
        description: 'Returns all trip members (excluding the caller) with their current rating scores if already rated.',
        responses: {
          '200': {
            description: 'Array of ratees with optional scores',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          display_name: { type: 'string' },
                          avatar: { type: 'string', nullable: true },
                          ethics: { type: 'integer', nullable: true, minimum: 1, maximum: 5 },
                          participation: { type: 'integer', nullable: true, minimum: 1, maximum: 5 },
                          flexibility: { type: 'integer', nullable: true, minimum: 1, maximum: 5 },
                          rated: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/ratings': {
      post: {
        tags: ['Ratings'],
        summary: 'Submit or update a rating for a member',
        description: 'Submit a rating. Owner/admin can overwrite existing ratings; regular members cannot.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ratee_id', 'ethics', 'participation', 'flexibility'],
                properties: {
                  ratee_id: { type: 'string', description: 'ID of the member being rated' },
                  ethics: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                  participation: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  flexibility: { type: 'integer', minimum: 1, maximum: 5, example: 3 }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Rating submitted' },
          '400': { description: 'Cannot rate yourself' },
          '409': { description: 'Rating already submitted and is final (non-owner)' }
        }
      }
    },
    '/ratings/results': {
      get: {
        tags: ['Ratings'],
        summary: 'Get aggregated rating results per member',
        description: 'Returns average scores across all raters for each ratee.',
        responses: {
          '200': {
            description: 'Array of aggregated ratings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          ratee_id: { type: 'string' },
                          display_name: { type: 'string' },
                          avatar: { type: 'string', nullable: true },
                          ethics_avg: { type: 'number' },
                          participation_avg: { type: 'number' },
                          flexibility_avg: { type: 'number' },
                          overall_avg: { type: 'number' },
                          rated_by_count: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/ratings/status': {
      get: {
        tags: ['Ratings'],
        summary: 'Get rating submission status for all members',
        description: 'Returns whether each active member has submitted ratings for all other members.',
        responses: {
          '200': {
            description: 'Array of member submission statuses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          display_name: { type: 'string' },
                          avatar: { type: 'string', nullable: true },
                          submitted: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/ratings/all': {
      get: {
        tags: ['Ratings'],
        summary: 'Get all individual ratings (Owner/Admin only)',
        description: 'Returns every rating given in the trip, grouped by rater. Only accessible by trip owner or admin.',
        responses: {
          '200': {
            description: 'Array of all individual ratings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          rater_id: { type: 'string' },
                          rater_name: { type: 'string' },
                          rater_avatar: { type: 'string', nullable: true },
                          ratee_id: { type: 'string' },
                          ratee_name: { type: 'string' },
                          ratee_avatar: { type: 'string', nullable: true },
                          ethics: { type: 'integer' },
                          participation: { type: 'integer' },
                          flexibility: { type: 'integer' },
                          created_at: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '403': { description: 'Requires owner or admin role' }
        }
      }
    },
    '/telegram/{chatId}/balance': {
      get: {
        tags: ['Telegram Bot'],
        summary: 'Get trip balance by Telegram chat ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'chatId', in: 'path', required: true, schema: { type: 'string' }, description: 'Telegram chat ID linked to a trip' }
        ],
        responses: {
          '200': {
            description: 'Trip balance data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        trip_id: { type: 'string' },
                        trip_name: { type: 'string' },
                        currency: { type: 'string' },
                        bank_balance: { type: 'number' },
                        total_deposits: { type: 'number' },
                        total_expenses: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized — invalid or missing API_SECRET' },
          '404': { description: 'Chat not linked or notifications disabled' }
        }
      }
    },
    '/telegram/{chatId}/expenses': {
      get: {
        tags: ['Telegram Bot'],
        summary: 'Get trip expenses by Telegram chat ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'chatId', in: 'path', required: true, schema: { type: 'string' }, description: 'Telegram chat ID linked to a trip' }
        ],
        responses: {
          '200': {
            description: 'Trip expenses with beneficiary details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        trip_id: { type: 'string' },
                        trip_name: { type: 'string' },
                        currency: { type: 'string' },
                        expenses: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              description: { type: 'string' },
                              category: { type: 'string' },
                              amount: { type: 'number' },
                              date: { type: 'string' },
                              beneficiaries: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    name: { type: 'string' },
                                    share: { type: 'number' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Chat not linked or notifications disabled' }
        }
      }
    },
    '/telegram/{chatId}/members': {
      get: {
        tags: ['Telegram Bot'],
        summary: 'Get trip members by Telegram chat ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'chatId', in: 'path', required: true, schema: { type: 'string' }, description: 'Telegram chat ID linked to a trip' }
        ],
        responses: {
          '200': {
            description: 'Trip members list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        trip_id: { type: 'string' },
                        members: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              role: { type: 'string' },
                              active: { type: 'boolean' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Chat not linked or notifications disabled' }
        }
      }
    },
    '/telegram/{chatId}/summary': {
      get: {
        tags: ['Telegram Bot'],
        summary: 'Get trip summary by Telegram chat ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'chatId', in: 'path', required: true, schema: { type: 'string' }, description: 'Telegram chat ID linked to a trip' }
        ],
        responses: {
          '200': {
            description: 'Full trip summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        trip_id: { type: 'string' },
                        trip_name: { type: 'string' },
                        currency: { type: 'string' },
                        bank_balance: { type: 'number' },
                        total_deposits: { type: 'number' },
                        total_expenses: { type: 'number' },
                        member_count: { type: 'integer' },
                        categories: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              category: { type: 'string' },
                              total: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Chat not linked or notifications disabled' }
        }
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