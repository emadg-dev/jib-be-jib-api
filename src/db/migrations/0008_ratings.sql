-- ============================================================
-- Migration 0008: Member ratings
-- ============================================================
-- Allows trip members to rate each other in three categories:
-- ethics, participation, and flexibility (1-5 each).
-- Each member can rate every other member exactly once per trip.
-- Ratings are final once submitted.
-- ============================================================

CREATE TABLE Ratings (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    rater_id TEXT NOT NULL,
    ratee_id TEXT NOT NULL,
    ethics INTEGER NOT NULL CHECK(ethics BETWEEN 1 AND 5),
    participation INTEGER NOT NULL CHECK(participation BETWEEN 1 AND 5),
    flexibility INTEGER NOT NULL CHECK(flexibility BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE,
    FOREIGN KEY (rater_id) REFERENCES Members(id) ON DELETE CASCADE,
    FOREIGN KEY (ratee_id) REFERENCES Members(id) ON DELETE CASCADE,
    UNIQUE(trip_id, rater_id, ratee_id)
);

CREATE INDEX idx_ratings_trip ON Ratings(trip_id);
CREATE INDEX idx_ratings_rater ON Ratings(rater_id);
CREATE INDEX idx_ratings_ratee ON Ratings(ratee_id);
