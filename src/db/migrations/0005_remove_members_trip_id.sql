-- Safety: backfill any Members that have a trip_id but no MemberTrips row.
-- This ensures zero data loss before we drop the legacy column.
INSERT OR IGNORE INTO MemberTrips (member_id, trip_id, role, active)
SELECT id, trip_id, role, 1 FROM Members WHERE trip_id IS NOT NULL AND trip_id != ''
AND NOT EXISTS (SELECT 1 FROM MemberTrips mt WHERE mt.member_id = Members.id AND mt.trip_id = Members.trip_id);

-- Now drop the legacy trip_id column from Members.
-- MemberTrips is the sole authoritative source for trip membership.
ALTER TABLE Members DROP COLUMN trip_id;
