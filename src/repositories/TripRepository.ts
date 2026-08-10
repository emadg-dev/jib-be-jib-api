export class TripRepository {
  constructor(private db: D1Database) {}

  async findById(id: string) {
    return this.db.prepare('SELECT * FROM Trips WHERE id = ?').bind(id).first();
  }

  async findForMember(memberId: string) {
    return (await this.db.prepare(`
      SELECT t.*, mt.role, mt.active
      FROM MemberTrips mt
      JOIN Trips t ON t.id = mt.trip_id
      WHERE mt.member_id = ?
      ORDER BY t.created_at ASC
    `).bind(memberId).all()).results;
  }

  async findActiveForMember(memberId: string) {
    return (await this.db.prepare(`
      SELECT t.*, mt.role, mt.active
      FROM MemberTrips mt
      JOIN Trips t ON t.id = mt.trip_id
      WHERE mt.member_id = ? AND mt.active = 1
      ORDER BY t.created_at ASC
    `).bind(memberId).all()).results;
  }

  async findAll() {
    return (await this.db.prepare('SELECT * FROM Trips ORDER BY created_at ASC').all()).results;
  }

  async findMembership(memberId: string, tripId: string) {
    return this.db.prepare(`
      SELECT mt.role, mt.active, t.name, t.currency
      FROM MemberTrips mt
      JOIN Trips t ON t.id = mt.trip_id
      WHERE mt.member_id = ? AND mt.trip_id = ?
    `).bind(memberId, tripId).first();
  }

  async create(id: string, name: string, currency: string, ownerId: string) {
    await this.db.batch([
      this.db.prepare('INSERT INTO Trips (id, name, currency) VALUES (?, ?, ?)').bind(id, name, currency),
      this.db.prepare("INSERT INTO MemberTrips (member_id, trip_id, role, active) VALUES (?, ?, 'owner', 1)").bind(ownerId, id)
    ]);
    return this.findById(id);
  }

  async update(id: string, name: string, currency: string) {
    return this.db.prepare(
      'UPDATE Trips SET name = ?, currency = ? WHERE id = ? RETURNING *'
    ).bind(name, currency, id).first();
  }

  async delete(id: string) {
    return this.db.prepare('DELETE FROM Trips WHERE id = ?').bind(id).run();
  }
}
