-- ============================================================
-- Migration 0009: Paid-by member on expenses
-- ============================================================
-- When an expense is paid by a member instead of the bank,
-- the bank is indebted to that member. The paid_by column
-- records who paid; NULL means the bank paid.
-- ============================================================

ALTER TABLE Withdrawals ADD COLUMN paid_by TEXT REFERENCES Members(id);
