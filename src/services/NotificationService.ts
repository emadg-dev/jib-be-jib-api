import { TelegramNotification, TelegramEventSetting, DEFAULT_NOTIFICATION_EVENTS } from '../dto/notification.dto';
import { Env } from '../types/env';
import { SettingsRepository } from '../repositories/SettingsRepository';

export interface NotificationService {
  send(notification: TelegramNotification): Promise<boolean>;
  sendTest(chatId: string, title: string, message: string): Promise<boolean>;
  sendRaw(tripId: string, message: string): Promise<boolean>;
}

export class TelegramNotificationService implements NotificationService {
  private settingsRepo: SettingsRepository;

  constructor(
    private db: D1Database,
    private webhookUrl: string | undefined,
    private defaultChatId: string | undefined,
    private enabled: boolean
  ) {
    this.settingsRepo = new SettingsRepository(db);
  }

  async send({ event, trip_id, title, message, metadata }: TelegramNotification): Promise<boolean> {
    if (!this.enabled) return false;
    if (!this.webhookUrl) {
      console.warn('Telegram webhook URL is not configured; notification not sent');
      return false;
    }

    try {
      const settings = await this.settingsRepo.getByTrip(trip_id);
      const chatId = settings?.telegram_chat_id || this.defaultChatId;
      if (!chatId) {
        console.warn('No Telegram chat ID configured for trip', trip_id);
        return false;
      }

      const masterEnabled = settings ? Number(settings.telegram_enabled) === 1 : true;
      const stored = settings?.telegram_events ? this.parseEvents(settings.telegram_events) : {};
      const storedCfg = stored[event];
      const defaultCfg = DEFAULT_NOTIFICATION_EVENTS[event];
      const eventEnabled = storedCfg ? storedCfg.enabled : (defaultCfg ? defaultCfg.enabled : true);
      if (!masterEnabled || !eventEnabled) return false;

      const template = storedCfg?.message || defaultCfg?.message || `${title}\n${message}`;
      const vars = await this.enrich({ title, message, ...(metadata ?? {}) }, trip_id);
      return this.post(chatId, renderTemplate(template, vars));
    } catch (error) {
      console.error('Telegram notification delivery failed', error);
      return false;
    }
  }

  async sendTest(chatId: string, title: string, message: string): Promise<boolean> {
    if (!this.enabled || !this.webhookUrl || !chatId) return false;
    return this.post(chatId, `${title}\n${message}`);
  }

  async sendRaw(tripId: string, message: string): Promise<boolean> {
    if (!this.enabled || !this.webhookUrl) return false;
    try {
      const settings = await this.settingsRepo.getByTrip(tripId);
      const chatId = settings?.telegram_chat_id || this.defaultChatId;
      if (!chatId) return false;
      const masterEnabled = settings ? Number(settings.telegram_enabled) === 1 : true;
      if (!masterEnabled) return false;
      return this.post(chatId, message);
    } catch (error) {
      console.error('Telegram raw send failed', error);
      return false;
    }
  }

  private async post(chatId: string, text: string): Promise<boolean> {
    const id = /^-?\d+$/.test(chatId) ? Number(chatId) : chatId;
    try {
      const response = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text })
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

  private async enrich(vars: Record<string, unknown>, tripId: string): Promise<Record<string, unknown>> {
    const out = { ...vars };
    if (out.member_id && !out.member_name) {
      const member = await this.db.prepare('SELECT display_name FROM Members WHERE id = ?')
        .bind(out.member_id as string).first<{ display_name: string }>();
      if (member) out.member_name = member.display_name;
    }
    if (!out.trip_name) {
      const trip = await this.db.prepare('SELECT name FROM Trips WHERE id = ?')
        .bind(tripId).first<{ name: string }>();
      if (trip) out.trip_name = trip.name;
    }
    if (out.benefactor_member_ids && !out.benefactors) {
      const memberIds = out.benefactor_member_ids as string[];
      const totalMembers = await this.db.prepare(
        'SELECT COUNT(*) AS count FROM MemberTrips WHERE trip_id = ? AND active = 1'
      ).bind(tripId).first<{ count: number }>();

      if (totalMembers && memberIds.length >= totalMembers.count) {
        out.benefactors = 'همه';
      } else {
        const placeholders = memberIds.map(() => '?').join(', ');
        const members = await this.db.prepare(
          `SELECT display_name FROM Members WHERE id IN (${placeholders}) AND role != 'admin'`
        ).bind(...memberIds).all<{ display_name: string }>();
        out.benefactors = members.results.map(m => m.display_name).join(', ');
      }
    }
    return out;
  }

  private parseEvents(raw: string): Record<string, TelegramEventSetting> {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}

const renderTemplate = (template: string, vars: Record<string, unknown>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`));

export const telegramNotificationsEnabled = (value: string | undefined): boolean =>
  value?.toLowerCase() === 'true' || value === '1';

export const notificationServiceFromEnv = (bindings: Env['Bindings']): NotificationService =>
  new TelegramNotificationService(
    bindings.DB,
    bindings.TELEGRAM_WEBHOOK_URL,
    bindings.TELEGRAM_CHAT_ID,
    telegramNotificationsEnabled(bindings.TELEGRAM_NOTIFICATIONS_ENABLED)
  );
