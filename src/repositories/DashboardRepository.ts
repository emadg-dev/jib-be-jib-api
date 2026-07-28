export class DashboardRepository {
    constructor(private db: D1Database) {}
  
    async getMemberStats() {
      const sql = `
        SELECT 
          m.id as member_id, 
          m.name,
          COALESCE(d.total_deposited, 0) as total_deposited,
          COALESCE(w.total_expenses, 0) as total_expenses,
          COALESCE(d.total_deposited, 0) - COALESCE(w.total_expenses, 0) as balance
        FROM Members m
        LEFT JOIN (
          SELECT member_id, SUM(amount) as total_deposited 
          FROM Deposits GROUP BY member_id
        ) d ON m.id = d.member_id
        LEFT JOIN (
          SELECT member_id, SUM(share) as total_expenses 
          FROM WithdrawalMembers GROUP BY member_id
        ) w ON m.id = w.member_id
      `;
      return (await this.db.prepare(sql).all()).results;
    }
  
    async getTotals() {
      const deposits = await this.db.prepare('SELECT SUM(amount) as total FROM Deposits').first();
      const withdrawals = await this.db.prepare('SELECT SUM(amount) as total FROM Withdrawals').first();
      return {
        totalDeposits: (deposits?.total as number) || 0,
        totalWithdrawals: (withdrawals?.total as number) || 0
      };
    }
  
    async getExpensesByCategory() {
      return (await this.db.prepare(`
        SELECT category, SUM(amount) as total 
        FROM Withdrawals 
        GROUP BY category 
        ORDER BY total DESC
      `).all()).results;
    }
  }