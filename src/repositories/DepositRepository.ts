export class DepositRepository {
    constructor(private db: D1Database) {}
  
    async findAll() {
      return (await this.db.prepare(`
        SELECT d.*, m.name as member_name 
        FROM Deposits d 
        JOIN Members m ON d.member_id = m.id 
        ORDER BY d.created_at DESC
      `).all()).results;
    }
  
    async create(id: string, trip_id: string, member_id: string, amount: number, note?: string) {
      return await this.db.prepare(
        'INSERT INTO Deposits (id, trip_id, member_id, amount, note) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, trip_id, member_id, amount, note || null).run();
    }
  
    async update(id: string, amount: number, note?: string) {
      return await this.db.prepare('UPDATE Deposits SET amount = ?, note = ? WHERE id = ?')
        .bind(amount, note || null, id).run();
    }
  
    async delete(id: string) {
      return await this.db.prepare('DELETE FROM Deposits WHERE id = ?').bind(id).run();
    }
  }