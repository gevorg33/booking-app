import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, PaymentStatus } from '../booking/entities/booking.entity.js';
import { LoyaltyService } from './loyalty.service.js';
import { LoyaltyCustomerMatcherService } from './loyalty-customer-matcher.service.js';
import { LoyaltyAccount, LoyaltyTransaction } from './entities/loyalty-account.entity.js';
import { resolveEligibleCashPaidForEarn, wasLoyaltyRedeemedOnBooking } from './loyalty-amount.util.js';
import {
  calculateEarnPoints,
  getEarnPercentCashback,
  isServiceExcludedFromLoyaltyEarn,
} from './loyalty-settings.util.js';
import { roundBonus } from './loyalty.constants.js';
import type {
  LoyaltyAwardResult,
  LoyaltyBackfillSummary,
  LoyaltyBackfillTenantSummary,
} from './loyalty-award.types.js';

@Injectable()
export class LoyaltyAwardService {
  private readonly logger = new Logger(LoyaltyAwardService.name);

  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(LoyaltyTransaction) private txRepo: Repository<LoyaltyTransaction>,
    @InjectRepository(LoyaltyAccount) private accountRepo: Repository<LoyaltyAccount>,
    private loyaltyService: LoyaltyService,
    private customerMatcher: LoyaltyCustomerMatcherService,
  ) {}

  async awardForPaidBooking(bookingId: string): Promise<LoyaltyAwardResult> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { service: true, customer: true, business: true },
    });

    if (!booking) {
      return { status: 'skipped', bookingId, reason: 'not_paid' };
    }

    if (booking.paymentStatus !== PaymentStatus.PAID) {
      return { status: 'skipped', bookingId, reason: 'not_paid' };
    }

    if (await this.loyaltyService.hasEarnedForBooking(bookingId)) {
      return { status: 'skipped', bookingId, reason: 'already_awarded' };
    }

    const match = await this.customerMatcher.resolveForBooking(booking);
    if (match.status === 'ambiguous') {
      return {
        status: 'skipped',
        bookingId,
        reason: 'ambiguous_match',
        ambiguousCandidateIds: match.candidateCustomerIds,
      };
    }
    if (match.status !== 'matched' || !match.customerId) {
      return { status: 'skipped', bookingId, reason: 'no_customer' };
    }

    if (isServiceExcludedFromLoyaltyEarn(booking.business?.settings, booking.serviceId)) {
      return { status: 'skipped', bookingId, customerId: match.customerId, reason: 'service_excluded' };
    }

    const earnPercent = getEarnPercentCashback(booking.business?.settings);
    const cashPaid = resolveEligibleCashPaidForEarn({
      metadata: booking.metadata,
      servicePrice: booking.service ? Number(booking.service.price) : null,
    });

    if (cashPaid <= 0) {
      const reason = wasLoyaltyRedeemedOnBooking(booking.metadata)
        ? 'no_eligible_cash_payment'
        : 'zero_points';
      return { status: 'skipped', bookingId, customerId: match.customerId, reason };
    }

    const points = calculateEarnPoints(cashPaid, earnPercent);

    if (points <= 0) {
      return { status: 'skipped', bookingId, customerId: match.customerId, reason: 'zero_points' };
    }

    const awarded = await this.loyaltyService.earnForBooking(
      booking.businessId,
      match.customerId,
      points,
      bookingId,
      `Earned $${points} bonus (${earnPercent}% of $${cashPaid} cash paid)`,
    );

    if (!awarded) {
      return { status: 'skipped', bookingId, customerId: match.customerId, reason: 'already_awarded' };
    }

    this.logger.log(
      `Awarded ${points} loyalty points for booking ${bookingId} → customer ${match.customerId}`,
    );

    return {
      status: 'awarded',
      bookingId,
      customerId: match.customerId,
      points,
      matchMethod: match.method,
    };
  }

  async backfillPaidBookings(businessId?: string): Promise<LoyaltyBackfillSummary> {
    const summary: LoyaltyBackfillSummary = {
      scope: businessId ? 'single_tenant' : 'all_tenants',
      tenantCount: 0,
      processedBookings: 0,
      matchedCustomers: 0,
      bonusesAwarded: 0,
      totalPointsAwarded: 0,
      skipped: {
        not_paid: 0,
        already_awarded: 0,
        no_customer: 0,
        ambiguous_match: 0,
        zero_points: 0,
        no_eligible_cash_payment: 0,
        inactive_customer: 0,
        service_excluded: 0,
      },
      ambiguousRecords: [],
      byTenant: [],
    };

    const matchedCustomerIds = new Set<string>();
    const tenantStats = new Map<string, LoyaltyBackfillTenantSummary>();

    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.business', 'business')
      .where('booking.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .orderBy('booking.createdAt', 'ASC');

    if (businessId) {
      qb.andWhere('booking.businessId = :businessId', { businessId });
    }

    const bookings = await qb.getMany();

    for (const booking of bookings) {
      summary.processedBookings += 1;

      let tenant = tenantStats.get(booking.businessId);
      if (!tenant) {
        tenant = {
          businessId: booking.businessId,
          businessName: booking.business?.name,
          businessSlug: booking.business?.slug,
          earnPercentCashback: getEarnPercentCashback(booking.business?.settings),
          processedBookings: 0,
          bonusesAwarded: 0,
          totalPointsAwarded: 0,
        };
        tenantStats.set(booking.businessId, tenant);
      }
      tenant.processedBookings += 1;

      const result = await this.awardForPaidBooking(booking.id);

      if (result.status === 'awarded') {
        summary.bonusesAwarded += 1;
        summary.totalPointsAwarded += result.points ?? 0;
        tenant.bonusesAwarded += 1;
        tenant.totalPointsAwarded += result.points ?? 0;
        if (result.customerId) matchedCustomerIds.add(result.customerId);
        continue;
      }

      const reason = result.reason ?? 'not_paid';
      summary.skipped[reason] = (summary.skipped[reason] ?? 0) + 1;

      if (reason === 'ambiguous_match') {
        summary.ambiguousRecords.push({
          bookingId: booking.id,
          businessId: booking.businessId,
          emails: [],
          phones: [],
          candidateCustomerIds: result.ambiguousCandidateIds ?? [],
          reason: 'ambiguous_match',
        });
      }
    }

    summary.byTenant = [...tenantStats.values()].sort((a, b) =>
      (a.businessName ?? a.businessId).localeCompare(b.businessName ?? b.businessId),
    );
    summary.tenantCount = summary.byTenant.length;

    return {
      ...summary,
      matchedCustomers: matchedCustomerIds.size,
    };
  }

  /** Fix earn transactions that used the old 1:1 rule instead of percent-based bonuses. */
  async recalculateExistingEarnings(businessId?: string) {
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .where('tx.type = :type', { type: 'earn' })
      .andWhere('tx.bookingId IS NOT NULL');

    if (businessId) {
      qb.innerJoin(LoyaltyAccount, 'account', 'account.id = tx.account_id')
        .andWhere('account.business_id = :businessId', { businessId });
    }

    const transactions = await qb.getMany();
    let corrected = 0;
    let unchanged = 0;

    for (const tx of transactions) {
      const booking = await this.bookingRepo.findOne({
        where: { id: tx.bookingId! },
        relations: { service: true, business: true },
      });
      if (!booking || booking.paymentStatus !== PaymentStatus.PAID) {
        unchanged += 1;
        continue;
      }

      if (isServiceExcludedFromLoyaltyEarn(booking.business?.settings, booking.serviceId)) {
        const current = roundBonus(Number(tx.points));
        if (current > 0) {
          tx.points = 0;
          tx.note = 'Service excluded from bonus earn rate';
          await this.txRepo.save(tx);
          const account = await this.accountRepo.findOne({ where: { id: tx.accountId } });
          if (account) {
            account.pointsBalance = roundBonus(Math.max(0, account.pointsBalance - current));
            account.lifetimeEarned = roundBonus(Math.max(0, account.lifetimeEarned - current));
            await this.accountRepo.save(account);
          }
          corrected += 1;
        } else {
          unchanged += 1;
        }
        continue;
      }

      const earnPercent = getEarnPercentCashback(booking.business?.settings);
      const cashPaid = resolveEligibleCashPaidForEarn({
        metadata: booking.metadata,
        servicePrice: booking.service ? Number(booking.service.price) : null,
      });
      const correct = calculateEarnPoints(cashPaid, earnPercent);
      const current = roundBonus(Number(tx.points));
      const delta = roundBonus(correct - current);
      if (Math.abs(delta) < 0.001) {
        unchanged += 1;
        continue;
      }

      tx.points = correct;
      tx.note = `Recalculated: ${earnPercent}% of $${cashPaid} cash paid → $${correct}`;
      await this.txRepo.save(tx);

      const account = await this.accountRepo.findOne({ where: { id: tx.accountId } });
      if (account) {
        account.pointsBalance = roundBonus(account.pointsBalance + delta);
        account.lifetimeEarned = roundBonus(account.lifetimeEarned + delta);
        await this.accountRepo.save(account);
      }
      corrected += 1;
    }

    return { processed: transactions.length, corrected, unchanged };
  }
}
