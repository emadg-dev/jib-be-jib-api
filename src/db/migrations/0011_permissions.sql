CREATE TABLE TripMemberPermissions (
    member_id TEXT NOT NULL,
    trip_id TEXT NOT NULL,
    permission TEXT NOT NULL,
    effect TEXT NOT NULL DEFAULT 'allow' CHECK(effect IN ('allow', 'deny')),
    granted_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id, trip_id, permission),
    FOREIGN KEY (member_id) REFERENCES Members(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES Members(id) ON DELETE CASCADE
);

CREATE INDEX idx_trip_member_perms ON TripMemberPermissions(member_id, trip_id);
