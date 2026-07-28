export interface Env {
    Bindings: {
      DB: D1Database;
      JWT_SECRET: string;
    };
    Variables: {
      user: {
        id: string;
        name: string;
        role: 'owner' | 'member';
        trip_id: string;
      };
    };
  }