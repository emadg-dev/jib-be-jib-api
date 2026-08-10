-- Migration 0004: Add per-user preferences and avatar columns to Members
-- preferences: JSON string (e.g. {"stats": true, "timeline": false}) controlling dashboard section visibility
-- avatar: data URL string (compressed 256x256 JPEG) for the user's profile picture
-- This migration is safe for existing production data and does NOT delete any rows.
-- Both columns are nullable; the application treats NULL as "use defaults" (all sections visible, no avatar).

ALTER TABLE Members ADD COLUMN preferences TEXT;
ALTER TABLE Members ADD COLUMN avatar TEXT;
