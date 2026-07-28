export class WithdrawalRepository {
    constructor(private db: D1Database) {}
  
    async findAll() {
      const withdrawals = (await this.db.prepare('SELECT * FROM Withdrawals ORDER BY created_at DESC').all()).results;
      const wm = (await this.db.prepare(`
        SELECT wm.*, m.name as member_name 
        FROM WithdrawalMembers wm 
        JOIN Members m ON wm.member_id = m.id
      `).all()).results;
  
      return withdrawals.map((w: any) => ({
        ...w,
        beneficiaries: wm.filter((b: any) => b.withdrawal_id === w.id)
      }));
    }
  
    async create(id: string, trip_id: string, description: string, category: string, amount: number, beneficiaries: any[]) {
      const stmts = [
        this.db.prepare('INSERT INTO Withdrawals (id, trip_id, description, category, amount) VALUES (?, ?, ?, ?, ?)')
          .bind(id, trip_id, description, category, amount)
      ];
  
      for (const b of beneficiaries) {
        stmts.push(
          this.db.prepare('INSERT INTO WithdrawalMembers (withdrawal_id, member_id, share) VALUES (?, ?, ?)')
            .bind(id, b.member_id, b.share)
        );
      }
      return await this.db.batch(stmts);
    }
  
    async update(id: string, description: string, category: string, amount: number, beneficiaries: any[]) {
      const stmts = [
        this.db.prepare('UPDATE Withdrawals SET description = ?, category = ?, amount = ? WHERE id = ?')
          .bind(description, category, amount, id),
        this.db.prepare('DELETE FROM WithdrawalMembers WHERE withdrawal_id = ?').bind(id)
      ];
  
      for (const b of beneficiaries) {
        stmts.push(
          this.db.prepare('INSERT INTO WithdrawalMembers (withdrawal_id, member_id, share) VALUES (?, ?, ?)')
            .bind(id, b.member_id, b.share)
        );
      }
      return await this.db.batch(stmts);
    }
  
    async delete(id: string) {
      return await this.db.prepare('DELETE FROM Withdrawals WHERE id = ?').bind(id).run();
    }
  }