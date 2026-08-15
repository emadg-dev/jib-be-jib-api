export type NotificationEvent =
  | 'trip_created'
  | 'trip_updated'
  | 'member_added'
  | 'deposit_created'
  | 'expense_created'
  | 'rating_submitted'
  | 'settlement_recorded'
  | 'members_report'
  | 'bank_stats_report'
  | 'settlements_report'
  | 'ratings_report';

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
  expense_created: { enabled: true, message: 'Expense {description} ({category}) was added for {amount}.\nBenefactors: {benefactors}' },
  rating_submitted: { enabled: true, message: 'A member has submitted their ratings.' },
  settlement_recorded: { enabled: true, message: '{member_name} settled {amount}.' },
  members_report: { enabled: true, message: '👥 *Member Financial Breakdown*\n━━━━━━━━━━━━━━━━━━━━━━\n\n{members_list}\n\n━━━━━━━━━━━━━━━━━━━━━━\n🏦 Bank Balance: {bank_balance}' },
  bank_stats_report: { enabled: true, message: '🏦 *Bank Stats*\n\n💰 Bank Balance: *{bank_balance}*\n📈 Total Deposits: {total_deposits}\n📉 Total Expenses: {total_expenses}\n{settled_line}\n\n👥 Members: {member_count}\n{creditors_line}\n{debtors_line}' },
  settlements_report: { enabled: true, message: '📋 *Settlements Summary*\n\n{settlements_list}\n\n━━━━━━━━━━━━━━━━━━━━━━\n💰 Total Settled: *{total_settled}*\n📊 {settlement_count} settlement(s) recorded' },
  ratings_report: { enabled: true, message: '⭐ *Member Ratings*\n\n{ratings_list}\n\n━━━━━━━━━━━━━━━━━━━━━━\n📊 {rated_count} member(s) rated' },
};

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  trip_created: 'Trip created',
  trip_updated: 'Trip updated',
  member_added: 'Member added',
  deposit_created: 'Deposit added',
  expense_created: 'Expense added',
  rating_submitted: 'Rating submitted',
  settlement_recorded: 'Settlement recorded',
  members_report: 'Members report',
  bank_stats_report: 'Bank stats report',
  settlements_report: 'Settlements report',
  ratings_report: 'Ratings report',
};
