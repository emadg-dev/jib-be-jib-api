CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE TABLE withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE withdrawal_members (
    withdrawal_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    share REAL DEFAULT 1,
    PRIMARY KEY (withdrawal_id, member_id),
    FOREIGN KEY(withdrawal_id) REFERENCES withdrawals(id),
    FOREIGN KEY(member_id) REFERENCES members(id)
);