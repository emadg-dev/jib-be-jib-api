export class MemberRepository {
  constructor(private db: D1Database) {}

  async findByName(name: string) {
    return this.db.prepare('SELECT * FROM Members WHERE name = ?').bind(name).first();
  }

  async findById(id: string) {
    return this.db.prepare('SELECT id, name, display_name, created_at FROM Members WHERE id = ?').bind(id).first();
  }

  async findAll(tripId: string) {
    return (await this.db.prepare(`
      SELECT m.id, m.name, m.display_name, mt.role, mt.active, mt.created_at
      FROM MemberTrips mt
      JOIN Members m ON m.id = mt.member_id
      WHERE mt.trip_id = ?
      ORDER BY m.display_name COLLATE NOCASE ASC
    `).bind(tripId).all()).results;
  }

  async findInTrip(memberId: string, tripId: string) {
    return this.db.prepare(`
      SELECT m.id, m.name, m.display_name, mt.role, mt.active, mt.created_at
      FROM MemberTrips mt
      JOIN Members m ON m.id = mt.member_id
      WHERE mt.member_id = ? AND mt.trip_id = ?
    `).bind(memberId, tripId).first();
  }

  async create(id: string, tripId: string, name: string, displayName: string, hash: string, role: string, active: boolean) {
    await this.db.batch([
      this.db.prepare('INSERT INTO Members (id, trip_id, name, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, tripId, name, hash, role, displayName),
      this.db.prepare('INSERT INTO MemberTrips (member_id, trip_id, role, active) VALUES (?, ?, ?, ?)')
        .bind(id, tripId, role, Number(active))
    ]);
  }

  async addToTrip(memberId: string, tripId: string, role: string, active: boolean) {
    return this.db.prepare(`
      INSERT INTO MemberTrips (member_id, trip_id, role, active)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(member_id, trip_id) DO UPDATE SET role = excluded.role, active = excluded.active
    `).bind(memberId, tripId, role, Number(active)).run();
  }

  async update(memberId: string, tripId: string, displayName: string, role: string, active: boolean, hash?: string) {
    const statements = [
      this.db.prepare('UPDATE MemberTrips SET role = ?, active = ? WHERE member_id = ? AND trip_id = ?')
        .bind(role, Number(active), memberId, tripId),
      hash
        ? this.db.prepare('UPDATE Members SET display_name = ?, password_hash = ? WHERE id = ?').bind(displayName, hash, memberId)
        : this.db.prepare('UPDATE Members SET display_name = ? WHERE id = ?').bind(displayName, memberId)
    ];
    return this.db.batch(statements);
  }

  async removeFromTrip(memberId: string, tripId: string) {
    return this.db.prepare('DELETE FROM MemberTrips WHERE member_id = ? AND trip_id = ?').bind(memberId, tripId).run();
  }

  async isActiveInTrip(memberId: string, tripId: string) {
    return this.db.prepare('SELECT 1 FROM MemberTrips WHERE member_id = ? AND trip_id = ? AND active = 1')
      .bind(memberId, tripId).first();
  }
}
