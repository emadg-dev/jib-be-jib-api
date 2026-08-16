CREATE TABLE TripRoles (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default INTEGER NOT NULL DEFAULT 0 CHECK(is_default IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE,
    UNIQUE(trip_id, name)
);

CREATE TABLE TripRolePermissions (
    role_id TEXT NOT NULL,
    permission TEXT NOT NULL,
    PRIMARY KEY (role_id, permission),
    FOREIGN KEY (role_id) REFERENCES TripRoles(id) ON DELETE CASCADE
);

ALTER TABLE MemberTrips ADD COLUMN custom_role_id TEXT REFERENCES TripRoles(id) ON DELETE SET NULL;

CREATE INDEX idx_trip_roles_trip ON TripRoles(trip_id);
CREATE INDEX idx_member_trips_role ON MemberTrips(custom_role_id);
