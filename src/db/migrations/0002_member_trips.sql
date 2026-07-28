-- Keep existing accounts and transactions while moving trip-specific data to a membership table.
ALTER TABLE Members ADD COLUMN display_name TEXT;
UPDATE Members SET display_name = name WHERE display_name IS NULL;

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

INSERT INTO MemberTrips (member_id, trip_id, role, active, created_at)
SELECT id, trip_id, role, 1, created_at FROM Members;

CREATE INDEX idx_member_trips_trip ON MemberTrips(trip_id);
