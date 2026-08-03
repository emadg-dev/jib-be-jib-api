-- Migration 0003: Add date column to Deposits and Withdrawals
-- This migration is safe for existing production data and will NOT delete any rows.
-- It adds a nullable TEXT "date" column (ISO YYYY-MM-DD) and backfills existing rows using the date portion of created_at.
-- Note: SQLite does not allow non-constant defaults in ALTER TABLE, so we leave the column without a default
-- and ensure the application sets dates for new rows.

-- Add date column (no default)
ALTER TABLE Deposits ADD COLUMN date TEXT;
ALTER TABLE Withdrawals ADD COLUMN date TEXT;

-- Backfill existing rows from created_at (format: YYYY-MM-DD HH:MM:SS) -> YYYY-MM-DD
UPDATE Deposits SET date = substr(created_at, 1, 10) WHERE date IS NULL;
UPDATE Withdrawals SET date = substr(created_at, 1, 10) WHERE date IS NULL;
