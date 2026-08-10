-- ============================================================
-- Migration 0005: Remove trip_id from Members (safe rebuild)
-- ============================================================
-- SQLite cannot DROP COLUMN when foreign keys reference it.
-- This migration rebuilds Members without trip_id, preserving
-- ALL data in Members, MemberTrips, Deposits, WithdrawalMembers.
-- ============================================================

-- 1. Backup all data that references Members (FK ON DELETE CASCADE)
CREATE TABLE _backup_member_trips AS SELECT * FROM MemberTrips;
CREATE TABLE _backup_deposits AS SELECT * FROM Deposits;
CREATE TABLE _backup_withdrawal_members AS SELECT * FROM WithdrawalMembers;
CREATE TABLE _backup_members AS SELECT * FROM Members;

-- 2. Drop dependent tables first (order matters due to FKs)
DROP TABLE IF EXISTS WithdrawalMembers;
DROP TABLE IF EXISTS Deposits;
DROP TABLE IF EXISTS MemberTrips;

-- 3. Drop old Members (safe now, no dependents remain)
DROP TABLE IF EXISTS Members;

-- 4. Create new Members without trip_id
CREATE TABLE Members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    display_name TEXT NOT NULL,
    preferences TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Reinsert Members data (strip trip_id)
INSERT INTO Members (id, name, password_hash, role, display_name, preferences, avatar, created_at)
SELECT id, name, password_hash, role, display_name, preferences, avatar, created_at
FROM _backup_members;

-- 6. Recreate MemberTrips (without FK to Members.trip_id)
CREATE TABLE MemberTrips (
    member_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'member')),
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id, trip_id),
    FOREIGN KEY (member_id) REFERENCES Members(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE
);
INSERT INTO MemberTrips SELECT * FROM _backup_member_trips;

-- 7. Recreate Deposits
CREATE TABLE Deposits (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    note TEXT,
    date TEXT DEFAULT (DATE('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES Members(id) ON DELETE CASCADE
);
INSERT INTO Deposits SELECT * FROM _backup_deposits;

-- 8. Recreate WithdrawalMembers
CREATE TABLE WithdrawalMembers (
    withdrawal_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    share REAL NOT NULL CHECK(share >= 0),
    PRIMARY KEY (withdrawal_id, member_id),
    FOREIGN KEY (withdrawal_id) REFERENCES Withdrawals(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES Members(id) ON DELETE CASCADE
);
INSERT INTO WithdrawalMembers SELECT * FROM _backup_withdrawal_members;

-- 9. Recreate indexes
CREATE INDEX idx_member_trips_trip ON MemberTrips(trip_id);
CREATE INDEX idx_deposits_trip ON Deposits(trip_id);
-- CREATE INDEX idx_withdrawals_trip ON Withdrawals(trip_id);
CREATE INDEX idx_members_name ON Members(name);

-- 10. Drop backups (data is safe in rebuilt tables)
DROP TABLE IF EXISTS _backup_member_trips;
DROP TABLE IF EXISTS _backup_deposits;
DROP TABLE IF EXISTS _backup_withdrawal_members;
DROP TABLE IF EXISTS _backup_members;
