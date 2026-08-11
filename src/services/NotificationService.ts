import { TelegramNotification } from '../dto/notification.dto';
import { Env } from '../types/env';

export interface NotificationService {
  send(notification: TelegramNotification): Promise<boolean>;
}

export class TelegramNotificationService implements NotificationService {
  constructor(
    private readonly webhookUrl: string | undefined,
    private readonly chatId: string | undefined,
    private readonly enabled: boolean
  ) {}

  async send({ title, message }: TelegramNotification): Promise<boolean> {
    if (!this.enabled) return false;
    if (!this.webhookUrl || !this.chatId) {
      console.warn('Telegram webhook URL or chat ID is not configured; notification not sent');
      return false;
    }

    try {
      const chatId = /^-?\d+$/.test(this.chatId) ? Number(this.chatId) : this.chatId;
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${title}\n${message}`
        })
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        console.error(`Telegram webhook returned status ${response.status}`, detail.slice(0, 300));
        return false;
      }
      return true;
    } catch (error) {
      console.error('Telegram notification delivery failed', error);
      return false;
    }
  }
}

export const telegramNotificationsEnabled = (value: string | undefined): boolean =>
  value?.toLowerCase() === 'true' || value === '1';

export const notificationServiceFromEnv = (bindings: Env['Bindings']): NotificationService =>
  new TelegramNotificationService(
    bindings.TELEGRAM_WEBHOOK_URL,
    bindings.TELEGRAM_CHAT_ID,
    telegramNotificationsEnabled(bindings.TELEGRAM_NOTIFICATIONS_ENABLED)
  );
