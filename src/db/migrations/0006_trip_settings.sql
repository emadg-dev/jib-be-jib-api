-- ============================================================
-- Migration 0006: Per-trip notification settings
-- ============================================================
-- Stores Telegram notification preferences per trip: master
-- toggle, the target group chat id, and per-event configuration
-- (enabled + custom message template) serialized as JSON.
-- ============================================================

CREATE TABLE TripSettings (
    trip_id TEXT PRIMARY KEY,
    telegram_enabled INTEGER NOT NULL DEFAULT 0 CHECK(telegram_enabled IN (0, 1)),
    telegram_chat_id TEXT,
    telegram_events TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE
);
