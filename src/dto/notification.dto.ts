export interface TelegramNotification {
  event: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export type NotificationEvent =
  | 'trip_created'
  | 'trip_updated'
  | 'member_added'
  | 'expense_created';
