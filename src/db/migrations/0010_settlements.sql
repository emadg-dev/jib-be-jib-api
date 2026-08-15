CREATE TABLE Settlements (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES Trips(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES Members(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  note TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_settlements_trip ON Settlements(trip_id);
CREATE INDEX idx_settlements_member ON Settlements(member_id);
