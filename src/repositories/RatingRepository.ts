export interface RatingRow {
  id: string;
  trip_id: string;
  rater_id: string;
  ratee_id: string;
  ethics: number;
  participation: number;
  flexibility: number;
  created_at: string;
}

export interface RatingAggregate {
  ratee_id: string;
  display_name: string;
  avatar: string | null;
  ethics_avg: number;
  participation_avg: number;
  flexibility_avg: number;
  overall_avg: number;
  rated_by_count: number;
}

export class RatingRepository {
  constructor(private db: D1Database) {}

  async findExisting(raterId: string, rateeId: string, tripId: string) {
    return this.db.prepare(
      'SELECT id, ethics, participation, flexibility FROM Ratings WHERE rater_id = ? AND ratee_id = ? AND trip_id = ?'
    ).bind(raterId, rateeId, tripId).first<{ id: string; ethics: number; participation: number; flexibility: number }>();
  }

  async getRatingsByRater(raterId: string, tripId: string) {
    return (await this.db.prepare(
      'SELECT * FROM Ratings WHERE rater_id = ? AND trip_id = ?'
    ).bind(raterId, tripId).all<RatingRow>()).results;
  }

  async upsert(raterId: string, rateeId: string, tripId: string, ethics: number, participation: number, flexibility: number) {
    const id = `rat_${crypto.randomUUID()}`;
    return this.db.prepare(`
      INSERT INTO Ratings (id, trip_id, rater_id, ratee_id, ethics, participation, flexibility)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(trip_id, rater_id, ratee_id) DO UPDATE SET
        ethics = excluded.ethics,
        participation = excluded.participation,
        flexibility = excluded.flexibility,
        created_at = CURRENT_TIMESTAMP
    `).bind(id, tripId, raterId, rateeId, ethics, participation, flexibility).run();
  }

  async getAggregates(tripId: string): Promise<RatingAggregate[]> {
    return (await this.db.prepare(`
      SELECT
        m.id AS ratee_id,
        m.display_name,
        m.avatar,
        ROUND(AVG(r.ethics), 1) AS ethics_avg,
        ROUND(AVG(r.participation), 1) AS participation_avg,
        ROUND(AVG(r.flexibility), 1) AS flexibility_avg,
        ROUND(AVG((r.ethics + r.participation + r.flexibility) / 3.0), 1) AS overall_avg,
        COUNT(r.id) AS rated_by_count
      FROM Ratings r
      JOIN Members m ON m.id = r.ratee_id
      WHERE r.trip_id = ?
      GROUP BY r.ratee_id
      ORDER BY overall_avg DESC
    `).bind(tripId).all<RatingAggregate>()).results;
  }

  async getRaterStatus(tripId: string) {
    const allMembers = (await this.db.prepare(
      `SELECT m.id, m.display_name, m.avatar
       FROM MemberTrips mt
       JOIN Members m ON m.id = mt.member_id
       WHERE mt.trip_id = ? AND mt.active = 1 AND m.role != 'admin'`
    ).bind(tripId).all<{ id: string; display_name: string; avatar: string | null }>()).results;

    const activeMemberCount = allMembers.length;

    const ratedCounts = (await this.db.prepare(
      `SELECT rater_id, COUNT(DISTINCT ratee_id) AS rated_count
       FROM Ratings
       WHERE trip_id = ?
       GROUP BY rater_id`
    ).bind(tripId).all<{ rater_id: string; rated_count: number }>()).results;

    const ratedMap = new Map(ratedCounts.map(r => [r.rater_id, r.rated_count]));

    return allMembers.map(m => ({
      id: m.id,
      display_name: m.display_name,
      avatar: m.avatar,
      submitted: (ratedMap.get(m.id) || 0) >= (activeMemberCount - 1),
    }));
  }

  async deleteByPair(raterId: string, rateeId: string, tripId: string) {
    return this.db.prepare(
      'DELETE FROM Ratings WHERE rater_id = ? AND ratee_id = ? AND trip_id = ?'
    ).bind(raterId, rateeId, tripId).run();
  }

  async deleteByRater(raterId: string, tripId: string) {
    return this.db.prepare(
      'DELETE FROM Ratings WHERE rater_id = ? AND trip_id = ?'
    ).bind(raterId, tripId).run();
  }

  async getAllRatings(tripId: string) {
    return (await this.db.prepare(`
      SELECT
        r.id,
        r.rater_id,
        rater.display_name AS rater_name,
        rater.avatar AS rater_avatar,
        r.ratee_id,
        ratee.display_name AS ratee_name,
        ratee.avatar AS ratee_avatar,
        r.ethics,
        r.participation,
        r.flexibility,
        r.created_at
      FROM Ratings r
      JOIN Members rater ON rater.id = r.rater_id
      JOIN Members ratee ON ratee.id = r.ratee_id
      WHERE r.trip_id = ?
      ORDER BY rater.display_name COLLATE NOCASE ASC, ratee.display_name COLLATE NOCASE ASC
    `).bind(tripId).all()).results;
  }

  async getMyRatings(raterId: string, tripId: string) {
    return (await this.db.prepare(`
      SELECT
        r.id,
        r.rater_id,
        rater.display_name AS rater_name,
        rater.avatar AS rater_avatar,
        r.ratee_id,
        ratee.display_name AS ratee_name,
        ratee.avatar AS ratee_avatar,
        r.ethics,
        r.participation,
        r.flexibility,
        r.created_at
      FROM Ratings r
      JOIN Members rater ON rater.id = r.rater_id
      JOIN Members ratee ON ratee.id = r.ratee_id
      WHERE r.trip_id = ? AND r.rater_id = ?
      ORDER BY ratee.display_name COLLATE NOCASE ASC
    `).bind(tripId, raterId).all()).results;
  }

  async findById(ratingId: string, tripId: string) {
    return this.db.prepare(
      'SELECT id, rater_id, ratee_id, ethics, participation, flexibility FROM Ratings WHERE id = ? AND trip_id = ?'
    ).bind(ratingId, tripId).first<RatingRow>();
  }

  async deleteRating(ratingId: string, tripId: string) {
    return this.db.prepare(
      'DELETE FROM Ratings WHERE id = ? AND trip_id = ?'
    ).bind(ratingId, tripId).run();
  }
}
