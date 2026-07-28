export class TripRepository {
    constructor(private db: D1Database) {}
  
    async getFirst() {
      return await this.db.prepare('SELECT * FROM Trips LIMIT 1').first();
    }
  
    async update(id: string, name: string, currency: string) {
      return await this.db.prepare(
        'UPDATE Trips SET name = ?, currency = ? WHERE id = ? RETURNING *'
      ).bind(name, currency, id).first();
    }
  }