export class MemberRepository {
    constructor(private db: D1Database) {}
  
    async findByName(name: string) {
      return await this.db.prepare('SELECT * FROM Members WHERE name = ?').bind(name).first();
    }
  
    async findById(id: string) {
      return await this.db.prepare('SELECT * FROM Members WHERE id = ?').bind(id).first();
    }
  
    async findAll() {
      return (await this.db.prepare('SELECT id, trip_id, name, role, created_at FROM Members ORDER BY created_at ASC').all()).results;
    }
  
    async create(id: string, trip_id: string, name: string, hash: string, role: string) {
      return await this.db.prepare(
        'INSERT INTO Members (id, trip_id, name, password_hash, role) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, trip_id, name, hash, role).run();
    }
  
    async update(id: string, name: string, role: string, hash?: string) {
      if (hash) {
        return await this.db.prepare('UPDATE Members SET name = ?, role = ?, password_hash = ? WHERE id = ?')
          .bind(name, role, hash, id).run();
      }
      return await this.db.prepare('UPDATE Members SET name = ?, role = ? WHERE id = ?')
        .bind(name, role, id).run();
    }
  
    async delete(id: string) {
      return await this.db.prepare('DELETE FROM Members WHERE id = ?').bind(id).run();
    }
  }