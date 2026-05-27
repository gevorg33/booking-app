import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyAccount, LoyaltyTransaction } from './entities/loyalty-account.entity.js';

const POINTS_PER_DOLLAR = 1;

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyAccount) private accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction) private txRepo: Repository<LoyaltyTransaction>,
  ) {}

  async getOrCreate(businessId: string, customerId: string): Promise<LoyaltyAccount> {
    let account = await this.accountRepo.findOne({ where: { businessId, customerId } });
    if (!account) {
      account = await this.accountRepo.save(
        this.accountRepo.create({ businessId, customerId, pointsBalance: 0, lifetimeEarned: 0 }),
      );
    }
    return account;
  }

  async getBalance(businessId: string, customerId: string) {
    const account = await this.getOrCreate(businessId, customerId);
    const transactions = await this.txRepo.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return { account, transactions };
  }

  async earn(businessId: string, customerId: string, amountSpent: number, bookingId?: string) {
    const points = Math.floor(amountSpent * POINTS_PER_DOLLAR);
    if (points <= 0) return this.getOrCreate(businessId, customerId);
    const account = await this.getOrCreate(businessId, customerId);
    account.pointsBalance += points;
    account.lifetimeEarned += points;
    await this.accountRepo.save(account);
    await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        points,
        type: 'earn',
        bookingId,
        note: `Earned from booking`,
      }),
    );
    return account;
  }

  async redeem(businessId: string, customerId: string, points: number, bookingId?: string) {
    const account = await this.getOrCreate(businessId, customerId);
    if (points <= 0 || account.pointsBalance < points) {
      throw new BadRequestException('Insufficient loyalty points');
    }
    account.pointsBalance -= points;
    await this.accountRepo.save(account);
    await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        points: -points,
        type: 'redeem',
        bookingId,
        note: `Redeemed on booking`,
      }),
    );
    return account;
  }

  async adjust(businessId: string, customerId: string, points: number, note?: string) {
    const account = await this.getOrCreate(businessId, customerId);
    account.pointsBalance += points;
    if (points > 0) account.lifetimeEarned += points;
    await this.accountRepo.save(account);
    await this.txRepo.save(
      this.txRepo.create({ accountId: account.id, points, type: 'adjust', note }),
    );
    return account;
  }
}
