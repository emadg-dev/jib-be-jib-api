export class DepositRepository {
  constructor(private db: D1Database) {}

  async findAll(tripId: string) {
    return (await this.db.prepare(`
      SELECT d.*, m.display_name AS member_name
      FROM Deposits d
      JOIN Members m ON d.member_id = m.id
      WHERE d.trip_id = ?
      ORDER BY d.date DESC, d.created_at DESC
    `).bind(tripId).all()).results;
  }

  async create(id: string, tripId: string, memberId: string, amount: number, note?: string, date?: string) {
    return this.db.prepare(`
      INSERT INTO Deposits (id, trip_id, member_id, amount, note, date)
      SELECT ?, ?, ?, ?, ?, COALESCE(?, DATE('now'))
      WHERE EXISTS (
        SELECT 1 FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1
      )
    `).bind(id, tripId, memberId, amount, note || null, date || null, memberId, tripId).run();
  }

  async update(id: string, tripId: string, amount: number, note?: string, date?: string) {
    return this.db.prepare('UPDATE Deposits SET amount = ?, note = ?, date = COALESCE(?, date) WHERE id = ? AND trip_id = ?')
      .bind(amount, note || null, date || null, id, tripId).run();
  }

  async delete(id: string, tripId: string) {
    return this.db.prepare('DELETE FROM Deposits WHERE id = ? AND trip_id = ?').bind(id, tripId).run();
  }
}
