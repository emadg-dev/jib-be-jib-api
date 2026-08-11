-- ============================================================
-- Migration 0007: Enforce unique Telegram chat per trip
-- ============================================================
-- Ensures a Telegram chat ID can only be linked to one trip,
-- preventing accidental duplicate mappings.
-- ============================================================

CREATE UNIQUE INDEX idx_tripsettings_telegram_chat_id
  ON TripSettings(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;
