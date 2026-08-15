export class SettlementRepository {
  constructor(private db: D1Database) {}

  async findAll(tripId: string) {
    return (await this.db.prepare(`
      SELECT s.*, m.display_name AS member_name
      FROM Settlements s
      JOIN Members m ON s.member_id = m.id
      WHERE s.trip_id = ?
      ORDER BY s.date DESC, s.created_at DESC
    `).bind(tripId).all()).results;
  }

  async create(id: string, tripId: string, memberId: string, amount: number, note?: string, date?: string) {
    return this.db.prepare(`
      INSERT INTO Settlements (id, trip_id, member_id, amount, note, date)
      SELECT ?, ?, ?, ?, ?, COALESCE(?, DATE('now'))
      WHERE EXISTS (
        SELECT 1 FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1
      )
    `).bind(id, tripId, memberId, amount, note || null, date || null, memberId, tripId).run();
  }

  async update(id: string, tripId: string, memberId: string, amount: number, note?: string, date?: string) {
    return this.db.prepare('UPDATE Settlements SET member_id = ?, amount = ?, note = ?, date = COALESCE(?, date) WHERE id = ? AND trip_id = ?')
      .bind(memberId, amount, note || null, date || null, id, tripId).run();
  }

  async delete(id: string, tripId: string) {
    return this.db.prepare('DELETE FROM Settlements WHERE id = ? AND trip_id = ?').bind(id, tripId).run();
  }

  async getTotalSettled(tripId: string) {
    const result = await this.db.prepare('SELECT SUM(amount) AS total FROM Settlements WHERE trip_id = ?').bind(tripId).first();
    return (result?.total as number) || 0;
  }
}
