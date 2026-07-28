export interface AuthenticatedUser {
  id: string;
  name: string;
  display_name: string;
  role?: 'owner' | 'member';
  trip_id?: string;
}

export interface Env {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
  };
  Variables: {
    user: AuthenticatedUser;
  };
}
