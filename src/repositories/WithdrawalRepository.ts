export class WithdrawalRepository {
  constructor(private db: D1Database) {}

  async findAll(tripId: string) {
    const withdrawals = (await this.db.prepare(
      'SELECT * FROM Withdrawals WHERE trip_id = ? ORDER BY date DESC, created_at DESC'
    ).bind(tripId).all()).results;
    const beneficiaries = (await this.db.prepare(`
      SELECT wm.*, m.display_name AS member_name, m.avatar AS member_avatar
      FROM WithdrawalMembers wm
      JOIN Withdrawals w ON w.id = wm.withdrawal_id
      JOIN Members m ON wm.member_id = m.id
      WHERE w.trip_id = ? AND m.role != 'admin'
    `).bind(tripId).all()).results;

    const paidByMembers = (await this.db.prepare(`
      SELECT w.id AS withdrawal_id, m.display_name AS paid_by_name, m.avatar AS paid_by_avatar
      FROM Withdrawals w
      JOIN Members m ON w.paid_by = m.id
      WHERE w.trip_id = ? AND w.paid_by IS NOT NULL
    `).bind(tripId).all()).results;

    const paidByMap = new Map(paidByMembers.map((p: any) => [p.withdrawal_id, { paid_by_name: p.paid_by_name, paid_by_avatar: p.paid_by_avatar }]));

    return withdrawals.map((withdrawal: any) => ({
      ...withdrawal,
      paid_by_name: paidByMap.get(withdrawal.id)?.paid_by_name || null,
      paid_by_avatar: paidByMap.get(withdrawal.id)?.paid_by_avatar || null,
      beneficiaries: beneficiaries.filter((beneficiary: any) => beneficiary.withdrawal_id === withdrawal.id)
    }));
  }

  async create(id: string, tripId: string, description: string, category: string, amount: number, beneficiaries: any[], paidBy: string | null, date?: string) {
    const allActive = await this.areMembersActive(tripId, beneficiaries);
    if (!allActive) return false;

    const statements = [
      this.db.prepare('INSERT INTO Withdrawals (id, trip_id, description, category, amount, paid_by, date) VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, DATE(\'now\')) )')
        .bind(id, tripId, description, category, amount, paidBy || null, date || null),
      ...beneficiaries.map((beneficiary) => this.db.prepare(
        'INSERT INTO WithdrawalMembers (withdrawal_id, member_id, share) VALUES (?, ?, ?)'
      ).bind(id, beneficiary.member_id, beneficiary.share))
    ];
    await this.db.batch(statements);
    return true;
  }

  async update(id: string, tripId: string, description: string, category: string, amount: number, beneficiaries: any[], paidBy: string | null, date?: string) {
    const allActive = await this.areMembersActive(tripId, beneficiaries);
    if (!allActive) return false;

    const statements = [
      this.db.prepare('UPDATE Withdrawals SET description = ?, category = ?, amount = ?, paid_by = ?, date = COALESCE(?, date) WHERE id = ? AND trip_id = ?')
        .bind(description, category, amount, paidBy || null, date || null, id, tripId),
      this.db.prepare('DELETE FROM WithdrawalMembers WHERE withdrawal_id = ? AND EXISTS (SELECT 1 FROM Withdrawals WHERE id = ? AND trip_id = ?)')
        .bind(id, id, tripId),
      ...beneficiaries.map((beneficiary) => this.db.prepare(
        'INSERT INTO WithdrawalMembers (withdrawal_id, member_id, share) VALUES (?, ?, ?)'
      ).bind(id, beneficiary.member_id, beneficiary.share))
    ];
    await this.db.batch(statements);
    return true;
  }

  async delete(id: string, tripId: string) {
    return this.db.prepare('DELETE FROM Withdrawals WHERE id = ? AND trip_id = ?').bind(id, tripId).run();
  }

  private async areMembersActive(tripId: string, beneficiaries: any[]) {
    const memberIds = [...new Set(beneficiaries.map((beneficiary) => beneficiary.member_id))];
    const placeholders = memberIds.map(() => '?').join(', ');
    const result = await this.db.prepare(`
      SELECT COUNT(*) AS count FROM MemberTrips
      WHERE trip_id = ? AND active = 1 AND member_id IN (${placeholders})
    `).bind(tripId, ...memberIds).first<{ count: number }>();
    return result?.count === memberIds.length;
  }
}
