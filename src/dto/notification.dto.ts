export type NotificationEvent =
  | 'trip_created'
  | 'trip_updated'
  | 'member_added'
  | 'deposit_created'
  | 'expense_created';

export interface TelegramNotification {
  event: NotificationEvent;
  trip_id: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface TelegramEventSetting {
  enabled: boolean;
  message: string;
}

export interface TelegramSettings {
  telegram_enabled: boolean;
  telegram_chat_id?: string;
  events: Record<string, TelegramEventSetting>;
}

export const DEFAULT_NOTIFICATION_EVENTS: Record<NotificationEvent, TelegramEventSetting> = {
  trip_created: { enabled: true, message: 'A new trip "{trip_name}" was created.' },
  trip_updated: { enabled: true, message: 'Trip "{trip_name}" was updated.' },
  member_added: { enabled: true, message: '{member_name} joined the trip.' },
  deposit_created: { enabled: true, message: '{member_name} deposited {amount}.' },
  expense_created: { enabled: true, message: 'Expense {description} ({category}) was added for {amount}.\nBenefactors: {benefactors}' }
};

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  trip_created: 'Trip created',
  trip_updated: 'Trip updated',
  member_added: 'Member added',
  deposit_created: 'Deposit added',
  expense_created: 'Expense added'
};
