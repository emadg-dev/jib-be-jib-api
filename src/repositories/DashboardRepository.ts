export class DashboardRepository {
  constructor(private db: D1Database) {}

  async getMemberStats(tripId: string) {
    const sql = `
      SELECT
        m.id AS member_id,
        m.name,
        m.display_name,
        m.avatar,
        mt.active,
        COALESCE(d.total_deposited, 0) AS total_deposited,
        COALESCE(w.total_expenses, 0) AS total_expenses,
        COALESCE(d.total_deposited, 0) + COALESCE(p.total_paid, 0) - COALESCE(w.total_expenses, 0) AS balance
      FROM MemberTrips mt
      JOIN Members m ON m.id = mt.member_id
      LEFT JOIN (
        SELECT member_id, SUM(amount) AS total_deposited
        FROM Deposits
        WHERE trip_id = ?
        GROUP BY member_id
      ) d ON m.id = d.member_id
      LEFT JOIN (
        SELECT wm.member_id, SUM(wm.share) AS total_expenses
        FROM WithdrawalMembers wm
        JOIN Withdrawals w ON w.id = wm.withdrawal_id
        WHERE w.trip_id = ?
        GROUP BY wm.member_id
      ) w ON m.id = w.member_id
      LEFT JOIN (
        SELECT paid_by AS member_id, SUM(amount) AS total_paid
        FROM Withdrawals
        WHERE trip_id = ? AND paid_by IS NOT NULL
        GROUP BY paid_by
      ) p ON m.id = p.member_id
      WHERE mt.trip_id = ? AND m.role != 'admin'
      ORDER BY m.display_name COLLATE NOCASE ASC
    `;
    return (await this.db.prepare(sql).bind(tripId, tripId, tripId, tripId).all()).results;
  }

  async getTotals(tripId: string) {
    const deposits = await this.db.prepare('SELECT SUM(amount) AS total FROM Deposits WHERE trip_id = ?').bind(tripId).first();
    const withdrawals = await this.db.prepare('SELECT SUM(amount) AS total FROM Withdrawals WHERE trip_id = ?').bind(tripId).first();
    const memberPaid = await this.db.prepare('SELECT SUM(amount) AS total FROM Withdrawals WHERE trip_id = ? AND paid_by IS NOT NULL').bind(tripId).first();
    return {
      totalDeposits: (deposits?.total as number) || 0,
      totalWithdrawals: (withdrawals?.total as number) || 0,
      totalMemberPaid: (memberPaid?.total as number) || 0
    };
  }

  async getExpensesByCategory(tripId: string) {
    return (await this.db.prepare(`
      SELECT category, SUM(amount) AS total
      FROM Withdrawals
      WHERE trip_id = ?
      GROUP BY category
      ORDER BY total DESC
    `).bind(tripId).all()).results;
  }
}
