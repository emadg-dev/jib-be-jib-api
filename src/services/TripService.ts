import { TripRepository } from '../repositories/TripRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { DepositRepository } from '../repositories/DepositRepository';
import { WithdrawalRepository } from '../repositories/WithdrawalRepository';
import { DashboardRepository } from '../repositories/DashboardRepository';
import { hashPassword } from '../utils/password';
import { calculateSettlements } from '../utils/settlement';
import { HTTPException } from 'hono/http-exception';

export class TripService {
  constructor(private repo: TripRepository) {}
  async getTrip(id: string) { return this.repo.findById(id); }
  async getTrips(memberId: string) { return this.repo.findForMember(memberId); }
  async createTrip(ownerId: string, data: { name: string; currency: string }) {
    return this.repo.create(`trip_${crypto.randomUUID()}`, data.name, data.currency, ownerId);
  }
  async updateTrip(id: string, name: string, currency: string) { return this.repo.update(id, name, currency); }
  async deleteTrip(id: string) { await this.repo.delete(id); }
}

export class MemberService {
  constructor(private repo: MemberRepository) {}
  async getMembers(tripId: string) { return this.repo.findAll(tripId); }
  async getMember(id: string, tripId: string) {
    const member = await this.repo.findInTrip(id, tripId);
    if (!member) throw new HTTPException(404, { message: 'Member not found in this trip' });
    return member;
  }
  async createMember(tripId: string, data: any) {
    const existingMember = await this.repo.findByName(data.name);
    if (existingMember) {
      const memberId = String(existingMember.id);
      if (await this.repo.findInTrip(memberId, tripId)) {
        throw new HTTPException(409, { message: 'Member is already assigned to this trip' });
      }
      await this.repo.addToTrip(memberId, tripId, data.role, data.active);
      return this.getMember(memberId, tripId);
    }

    const id = `mem_${crypto.randomUUID()}`;
    await this.repo.create(id, tripId, data.name, data.display_name, await hashPassword(data.password || 'password123'), data.role, data.active);
    return this.getMember(id, tripId);
  }
  async addMemberToTrip(tripId: string, data: any) {
    if (!await this.repo.findById(data.member_id)) throw new HTTPException(404, { message: 'Member not found' });
    await this.repo.addToTrip(data.member_id, tripId, data.role, data.active);
    return this.getMember(data.member_id, tripId);
  }
  async updateMember(id: string, tripId: string, data: any) {
    await this.getMember(id, tripId);
    await this.repo.update(id, tripId, data.display_name, data.role, data.active, data.password ? await hashPassword(data.password) : undefined);
    return this.getMember(id, tripId);
  }
  async deleteMember(id: string, tripId: string) { await this.repo.removeFromTrip(id, tripId); }
}

export class DepositService {
  constructor(private repo: DepositRepository) {}
  async getDeposits(tripId: string) { return this.repo.findAll(tripId); }
  async createDeposit(tripId: string, data: any) {
    const id = `dep_${crypto.randomUUID()}`;
    const result = await this.repo.create(id, tripId, data.member_id, data.amount, data.note, data.date);
    if (!result.meta.changes) throw new HTTPException(400, { message: 'Member must be active in this trip' });
    return { id, ...data };
  }
  async updateDeposit(id: string, tripId: string, data: any) { await this.repo.update(id, tripId, data.amount, data.note, data.date); return { id, ...data }; }
  async deleteDeposit(id: string, tripId: string) { await this.repo.delete(id, tripId); }
}

export class WithdrawalService {
  constructor(private repo: WithdrawalRepository) {}
  async getWithdrawals(tripId: string) { return this.repo.findAll(tripId); }
  async createWithdrawal(tripId: string, data: any) {
    const id = `wit_${crypto.randomUUID()}`;
    if (!await this.repo.create(id, tripId, data.description, data.category, data.amount, data.beneficiaries, data.date)) {
      throw new HTTPException(400, { message: 'All beneficiaries must be active members of this trip' });
    }
    return { id, ...data };
  }
  async updateWithdrawal(id: string, tripId: string, data: any) {
    if (!await this.repo.update(id, tripId, data.description, data.category, data.amount, data.beneficiaries, data.date)) {
      throw new HTTPException(400, { message: 'All beneficiaries must be active members of this trip' });
    }
    return { id, ...data };
  }
  async deleteWithdrawal(id: string, tripId: string) { await this.repo.delete(id, tripId); }
}

export class DashboardService {
  constructor(private repo: DashboardRepository) {}
  async getDashboardData(tripId: string) {
    const totals = await this.repo.getTotals(tripId);
    const members = await this.repo.getMemberStats(tripId);
    return {
      currentBankBalance: totals.totalDeposits - totals.totalWithdrawals,
      totalDeposits: totals.totalDeposits,
      totalWithdrawals: totals.totalWithdrawals,
      members,
      categories: await this.repo.getExpensesByCategory(tripId),
      settlements: calculateSettlements(members as any)
    };
  }
}
