import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LoyaltyAccount,
  LoyaltyTransaction,
} from './entities/loyalty-account.entity.js';
import {
  calculateEarnPoints,
  getEarnPercentCashback,
  maxRedeemablePoints,
  pointsToCurrency,
} from './loyalty-settings.util.js';
import { BONUS_DOLLAR_VALUE, roundBonus } from './loyalty.constants.js';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction)
    private txRepo: Repository<LoyaltyTransaction>,
  ) {}

  async getOrCreate(
    businessId: string,
    customerId: string,
  ): Promise<LoyaltyAccount> {
    let account = await this.accountRepo.findOne({
      where: { businessId, customerId },
    });
    if (!account) {
      account = await this.accountRepo.save(
        this.accountRepo.create({
          businessId,
          customerId,
          pointsBalance: 0,
          lifetimeEarned: 0,
        }),
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

  getPublicSummary(
    account: LoyaltyAccount,
    businessSettings?: Record<string, unknown> | null,
  ) {
    const earnPercentCashback = getEarnPercentCashback(businessSettings);
    return {
      pointsBalance: account.pointsBalance,
      lifetimeEarned: account.lifetimeEarned,
      bonusDollarValue: BONUS_DOLLAR_VALUE,
      earnPercentCashback,
      pointsValue: pointsToCurrency(account.pointsBalance),
    };
  }

  calculateEarnPoints(amountPaid: number, earnPercentCashback?: number) {
    return calculateEarnPoints(
      amountPaid,
      earnPercentCashback ?? getEarnPercentCashback(null),
    );
  }

  pointsToCurrency(points: number): number {
    return pointsToCurrency(points);
  }

  maxRedeemablePoints(balance: number, amountDue: number): number {
    return maxRedeemablePoints(balance, amountDue);
  }

  clampRedeemPoints(
    requested: number,
    balance: number,
    amountDue: number,
  ): number {
    const points = roundBonus(requested);
    const max = this.maxRedeemablePoints(balance, amountDue);
    if (points > max + 0.001) {
      throw new BadRequestException(
        'Not enough loyalty bonuses for this redemption',
      );
    }
    return points;
  }

  async hasEarnedForBooking(bookingId: string): Promise<boolean> {
    const existing = await this.txRepo.findOne({
      where: { bookingId, type: 'earn' },
    });
    return !!existing;
  }

  async earnForBooking(
    businessId: string,
    customerId: string,
    points: number,
    bookingId: string,
    note?: string,
  ): Promise<boolean> {
    const bonus = roundBonus(points);
    if (bonus <= 0) return false;
    if (await this.hasEarnedForBooking(bookingId)) return false;

    const account = await this.getOrCreate(businessId, customerId);
    account.pointsBalance = roundBonus(account.pointsBalance + bonus);
    account.lifetimeEarned = roundBonus(account.lifetimeEarned + bonus);
    await this.accountRepo.save(account);

    try {
      await this.txRepo.save(
        this.txRepo.create({
          accountId: account.id,
          points: bonus,
          type: 'earn',
          bookingId,
          note: note ?? 'Earned from paid booking',
        }),
      );
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        account.pointsBalance = roundBonus(account.pointsBalance - bonus);
        account.lifetimeEarned = roundBonus(account.lifetimeEarned - bonus);
        await this.accountRepo.save(account);
        return false;
      }
      throw err;
    }
  }

  async earn(
    businessId: string,
    customerId: string,
    amountSpent: number,
    bookingId?: string,
    earnPercentCashback?: number,
  ) {
    const points = this.calculateEarnPoints(amountSpent, earnPercentCashback);
    if (points <= 0) return this.getOrCreate(businessId, customerId);
    if (bookingId) {
      await this.earnForBooking(
        businessId,
        customerId,
        points,
        bookingId,
        'Earned from booking',
      );
      return this.getOrCreate(businessId, customerId);
    }
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
        note: 'Earned from booking',
      }),
    );
    return account;
  }

  /** Flat bonus (referrals, campaigns) — idempotent by note per account. */
  async awardFlatBonus(
    businessId: string,
    customerId: string,
    points: number,
    note: string,
  ): Promise<boolean> {
    const bonus = roundBonus(points);
    if (bonus <= 0) return false;

    const account = await this.getOrCreate(businessId, customerId);
    const existing = await this.txRepo.findOne({
      where: { accountId: account.id, type: 'earn', note },
    });
    if (existing) return false;

    account.pointsBalance = roundBonus(account.pointsBalance + bonus);
    account.lifetimeEarned = roundBonus(account.lifetimeEarned + bonus);
    await this.accountRepo.save(account);
    await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        points: bonus,
        type: 'earn',
        note,
      }),
    );
    return true;
  }

  async redeem(
    businessId: string,
    customerId: string,
    points: number,
    bookingId?: string,
  ) {
    const amount = roundBonus(points);
    const account = await this.getOrCreate(businessId, customerId);
    if (amount <= 0 || roundBonus(account.pointsBalance) < amount) {
      throw new BadRequestException('Insufficient loyalty bonuses');
    }
    account.pointsBalance = roundBonus(account.pointsBalance - amount);
    await this.accountRepo.save(account);
    await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        points: -amount,
        type: 'redeem',
        bookingId,
        note: 'Redeemed on booking',
      }),
    );
    return account;
  }

  async adjust(
    businessId: string,
    customerId: string,
    points: number,
    note?: string,
  ) {
    const account = await this.getOrCreate(businessId, customerId);
    account.pointsBalance += points;
    if (points > 0) account.lifetimeEarned += points;
    await this.accountRepo.save(account);
    await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        points,
        type: 'adjust',
        note,
      }),
    );
    return account;
  }

  /** prov-exp-9.2 — latest earn/redeem for provider loyalty quick view (read-only). */
  async getLastEarnRedeemTransactions(accountId: string) {
    const [lastEarn, lastRedeem] = await Promise.all([
      this.txRepo.findOne({
        where: { accountId, type: 'earn' },
        order: { createdAt: 'DESC' },
      }),
      this.txRepo.findOne({
        where: { accountId, type: 'redeem' },
        order: { createdAt: 'DESC' },
      }),
    ]);
    return { lastEarn, lastRedeem };
  }
}
