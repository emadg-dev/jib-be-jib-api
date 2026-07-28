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
  async getTrip() { return await this.repo.getFirst(); }
  async updateTrip(id: string, name: string, currency: string) { return await this.repo.update(id, name, currency); }
}

export class MemberService {
  constructor(private repo: MemberRepository) {}
  async getMembers() { return await this.repo.findAll(); }
  async getMember(id: string) { 
    const m = await this.repo.findById(id); 
    if(!m) throw new HTTPException(404, {message: 'Not found'});
    return m;
  }
  async createMember(tripId: string, data: any) {
    const id = `mem_${crypto.randomUUID()}`;
    const hash = await hashPassword(data.password || 'password123');
    await this.repo.create(id, tripId, data.name, hash, data.role);
    return { id, name: data.name, role: data.role };
  }
  async updateMember(id: string, data: any) {
    const hash = data.password ? await hashPassword(data.password) : undefined;
    await this.repo.update(id, data.name, data.role, hash);
    return { id, name: data.name, role: data.role };
  }
  async deleteMember(id: string) { await this.repo.delete(id); }
}

export class DepositService {
  constructor(private repo: DepositRepository) {}
  async getDeposits() { return await this.repo.findAll(); }
  async createDeposit(tripId: string, data: any) {
    const id = `dep_${crypto.randomUUID()}`;
    await this.repo.create(id, tripId, data.member_id, data.amount, data.note);
    return { id, ...data };
  }
  async updateDeposit(id: string, data: any) {
    await this.repo.update(id, data.amount, data.note);
    return { id, ...data };
  }
  async deleteDeposit(id: string) { await this.repo.delete(id); }
}

export class WithdrawalService {
  constructor(private repo: WithdrawalRepository) {}
  async getWithdrawals() { return await this.repo.findAll(); }
  async createWithdrawal(tripId: string, data: any) {
    const id = `wit_${crypto.randomUUID()}`;
    await this.repo.create(id, tripId, data.description, data.category, data.amount, data.beneficiaries);
    return { id, ...data };
  }
  async updateWithdrawal(id: string, data: any) {
    await this.repo.update(id, data.description, data.category, data.amount, data.beneficiaries);
    return { id, ...data };
  }
  async deleteWithdrawal(id: string) { await this.repo.delete(id); }
}

export class DashboardService {
  constructor(private repo: DashboardRepository) {}
  async getDashboardData() {
    const totals = await this.repo.getTotals();
    const members = await this.repo.getMemberStats();
    const categories = await this.repo.getExpensesByCategory();
    const settlements = calculateSettlements(members as any);

    return {
      currentBankBalance: totals.totalDeposits - totals.totalWithdrawals,
      totalDeposits: totals.totalDeposits,
      totalWithdrawals: totals.totalWithdrawals,
      members,
      categories,
      settlements
    };
  }
}