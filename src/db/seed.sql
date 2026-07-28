-- Creates a default trip and members with password 'password123'.
INSERT INTO Trips (id, name, currency) VALUES ('trip_1', 'Summer 2026', 'USD');

-- Hash for 'password123' (pre-generated using the PBKDF2 utility).
INSERT INTO Members (id, trip_id, name, password_hash, role, display_name) VALUES
('mem_1', 'trip_1', 'Emad', '54c600f918e61cb05bd43372c3d9735d482596abf284f6d4d1dae8bd203a3dff:8fa85bb2', 'owner', 'Emad'),
('mem_2', 'trip_1', 'Ali', '54c600f918e61cb05bd43372c3d9735d482596abf284f6d4d1dae8bd203a3dff:8fa85bb2', 'member', 'Ali'),
('mem_3', 'trip_1', 'Sara', '54c600f918e61cb05bd43372c3d9735d482596abf284f6d4d1dae8bd203a3dff:8fa85bb2', 'member', 'Sara'),
('mem_4', 'trip_1', 'Mohammad', '54c600f918e61cb05bd43372c3d9735d482596abf284f6d4d1dae8bd203a3dff:8fa85bb2', 'member', 'Mohammad');

INSERT INTO MemberTrips (member_id, trip_id, role, active) VALUES
('mem_1', 'trip_1', 'owner', 1), ('mem_2', 'trip_1', 'member', 1),
('mem_3', 'trip_1', 'member', 1), ('mem_4', 'trip_1', 'member', 1);

INSERT INTO Deposits (id, trip_id, member_id, amount, note) VALUES
('dep_1', 'trip_1', 'mem_1', 1000.0, 'Initial pool'),
('dep_2', 'trip_1', 'mem_2', 500.0, 'Flight fund');

INSERT INTO Withdrawals (id, trip_id, description, category, amount) VALUES
('wit_1', 'trip_1', 'Airbnb Booking', 'Accommodation', 800.0),
('wit_2', 'trip_1', 'Dinner', 'Food', 120.0);

INSERT INTO WithdrawalMembers (withdrawal_id, member_id, share) VALUES
('wit_1', 'mem_1', 200.0), ('wit_1', 'mem_2', 200.0),
('wit_1', 'mem_3', 200.0), ('wit_1', 'mem_4', 200.0),
('wit_2', 'mem_1', 40.0), ('wit_2', 'mem_2', 40.0), ('wit_2', 'mem_3', 40.0);
