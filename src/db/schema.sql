DROP TABLE IF EXISTS WithdrawalMembers;
DROP TABLE IF EXISTS Withdrawals;
DROP TABLE IF EXISTS Deposits;
DROP TABLE IF EXISTS MemberTrips;
DROP TABLE IF EXISTS Members;
DROP TABLE IF EXISTS Trips;

CREATE TABLE Trips (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE Withdrawals (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount > 0),
    paid_by TEXT REFERENCES Members(id),
    date TEXT DEFAULT (DATE('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE
);

CREATE TABLE WithdrawalMembers (
    withdrawal_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    share REAL NOT NULL CHECK(share >= 0),
    PRIMARY KEY (withdrawal_id, member_id),
    FOREIGN KEY (withdrawal_id) REFERENCES Withdrawals(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES Members(id) ON DELETE CASCADE
);

CREATE TABLE TripSettings (
    trip_id TEXT PRIMARY KEY,
    telegram_enabled INTEGER NOT NULL DEFAULT 0 CHECK(telegram_enabled IN (0, 1)),
    telegram_chat_id TEXT,
    telegram_events TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE
);

CREATE INDEX idx_member_trips_trip ON MemberTrips(trip_id);
CREATE INDEX idx_deposits_trip ON Deposits(trip_id);
CREATE INDEX idx_withdrawals_trip ON Withdrawals(trip_id);
