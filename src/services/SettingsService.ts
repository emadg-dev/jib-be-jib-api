import { SettingsRepository } from '../repositories/SettingsRepository';
import { DEFAULT_NOTIFICATION_EVENTS, TelegramEventSetting, TelegramSettings } from '../dto/notification.dto';

export class SettingsService {
  constructor(private repo: SettingsRepository) {}

  async getTelegramSettings(tripId: string): Promise<TelegramSettings> {
    const row = await this.repo.getByTrip(tripId);
    const stored = row?.telegram_events ? this.parseEvents(row.telegram_events) : {};
    const events: Record<string, TelegramEventSetting> = {};
    for (const [event, def] of Object.entries(DEFAULT_NOTIFICATION_EVENTS)) {
      events[event] = { enabled: def.enabled, message: def.message, ...(stored[event] ?? {}) };
    }
    return {
      telegram_enabled: row ? Number(row.telegram_enabled) === 1 : true,
      telegram_chat_id: row?.telegram_chat_id || undefined,
      events
    };
  }

  async updateTelegramSettings(
    tripId: string,
    data: {
      telegram_enabled: boolean;
      telegram_chat_id?: string;
      events?: Record<string, Partial<TelegramEventSetting>>;
    }
  ): Promise<TelegramSettings> {
    const existing = await this.repo.getByTrip(tripId);
    const existingEvents = existing?.telegram_events ? this.parseEvents(existing.telegram_events) : {};
    const mergedEvents = { ...existingEvents, ...(data.events ?? {}) };
    await this.repo.upsert(tripId, data.telegram_enabled, data.telegram_chat_id?.trim() || null, JSON.stringify(mergedEvents));
    return this.getTelegramSettings(tripId);
  }

  private parseEvents(raw: string): Record<string, Partial<TelegramEventSetting>> {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
