export interface AuthenticatedUser {
  id: string;
  name: string;
  display_name: string;
  role?: 'owner' | 'member' | 'admin';
  trip_id?: string;
  preferences?: Record<string, boolean>;
  avatar?: string;
}

export interface TelegramContext {
  trip_id: string;
  chat_id: string;
}

export interface Env {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    API_SECRET: string;
    TELEGRAM_WEBHOOK_URL: string;
    TELEGRAM_CHAT_ID: string;
    TELEGRAM_NOTIFICATIONS_ENABLED: string;
  };
  Variables: {
    user: AuthenticatedUser;
    telegramContext: TelegramContext;
  };
}
