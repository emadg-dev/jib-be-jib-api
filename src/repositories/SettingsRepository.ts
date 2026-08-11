export class SettingsRepository {
  constructor(private db: D1Database) {}

  async getByTrip(tripId: string) {
    return this.db.prepare('SELECT * FROM TripSettings WHERE trip_id = ?').bind(tripId).first<{
      trip_id: string;
      telegram_enabled: number;
      telegram_chat_id: string | null;
      telegram_events: string | null;
    }>();
  }

  async upsert(tripId: string, telegramEnabled: boolean, telegramChatId: string | null, eventsJson: string) {
    return this.db.prepare(`
      INSERT INTO TripSettings (trip_id, telegram_enabled, telegram_chat_id, telegram_events, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(trip_id) DO UPDATE SET
        telegram_enabled = excluded.telegram_enabled,
        telegram_chat_id = excluded.telegram_chat_id,
        telegram_events = excluded.telegram_events,
        updated_at = CURRENT_TIMESTAMP
    `).bind(tripId, Number(telegramEnabled), telegramChatId, eventsJson).run();
  }
}
