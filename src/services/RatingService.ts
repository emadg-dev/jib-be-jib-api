import { RatingRepository } from '../repositories/RatingRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { HTTPException } from 'hono/http-exception';

export class RatingService {
  constructor(
    private ratingRepo: RatingRepository,
    private memberRepo: MemberRepository
  ) {}

  async getRatees(raterId: string, tripId: string) {
    const members = await this.memberRepo.findAll(tripId);
    const existingRatings = await this.ratingRepo.getRatingsByRater(raterId, tripId);
    const ratingMap = new Map(existingRatings.map(r => [r.ratee_id, r]));

    return members
      .filter((m: any) => m.id !== raterId)
      .map((m: any) => {
        const existing = ratingMap.get(m.id);
        return {
          id: m.id,
          display_name: m.display_name,
          avatar: m.avatar,
          ethics: existing?.ethics ?? null,
          participation: existing?.participation ?? null,
          flexibility: existing?.flexibility ?? null,
          rated: !!existing,
        };
      });
  }

  async submitRating(raterId: string, tripId: string, rateeId: string, ethics: number, participation: number, flexibility: number, isOwnerOrAdmin: boolean) {
    if (raterId === rateeId) {
      throw new HTTPException(400, { message: 'Cannot rate yourself' });
    }

    const ratee = await this.memberRepo.findInTrip(rateeId, tripId);
    if (!ratee) {
      throw new HTTPException(404, { message: 'Member not found in this trip' });
    }

    const existing = await this.ratingRepo.findExisting(raterId, rateeId, tripId);
    if (existing && !isOwnerOrAdmin) {
      throw new HTTPException(409, { message: 'Rating already submitted and is final' });
    }

    if (existing && !isOwnerOrAdmin) {
      if (ethics < existing.ethics || participation < existing.participation || flexibility < existing.flexibility) {
        throw new HTTPException(400, { message: 'New ratings must be equal to or higher than previous ratings' });
      }
    }

    await this.ratingRepo.upsert(raterId, rateeId, tripId, ethics, participation, flexibility);
    return { success: true };
  }

  async deleteByRater(raterId: string, tripId: string) {
    return this.ratingRepo.deleteByRater(raterId, tripId);
  }

  async getAggregates(tripId: string) {
    return this.ratingRepo.getAggregates(tripId);
  }

  async getRaterStatus(tripId: string) {
    return this.ratingRepo.getRaterStatus(tripId);
  }

  async getAllRatings(tripId: string) {
    return this.ratingRepo.getAllRatings(tripId);
  }
}
