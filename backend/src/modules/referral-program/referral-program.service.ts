import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import {
  buildReferralAttributionMetadata,
  buildReferralConversionMetadata,
  buildReferralShareUrl,
  canSelfRefer,
  deriveReferralCodeFromCustomerId,
  hasReferralConversion,
  mergeReferralProgramSettings,
  normalizeReferralCode,
  readReferredByCustomerId,
  type ReferralProgramSettings,
} from '../../common/utils/referral-program.util.js';

export interface PublicReferralProgramView {
  referralCode: string;
  shareUrl: string;
  enabled: boolean;
  referrerBonusPoints: number;
  refereeBonusPoints: number;
  refereePromoCode: string | null;
  conversionsCount: number;
}

export interface ReferralClaimResult {
  attached: boolean;
  referralCode?: string;
  referrerCustomerId?: string;
  reason?: 'invalid_code' | 'self_referral' | 'already_attached' | 'disabled';
}

export interface ReferralConversionResult {
  converted: boolean;
  bookingId: string;
  referrerCustomerId?: string;
  referrerBonusPoints?: number;
  refereeBonusPoints?: number;
  reason?: string;
}

@Injectable()
export class ReferralProgramService {
  private readonly logger = new Logger(ReferralProgramService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private loyaltyService: LoyaltyService,
    private configService: ConfigService,
  ) {}

  async getReferralProgramView(
    businessId: string,
    customerId: string,
  ): Promise<PublicReferralProgramView> {
    const business = await this.requireBusiness(businessId);
    const settings = mergeReferralProgramSettings(business.settings);
    const referralCode = deriveReferralCodeFromCustomerId(customerId);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const conversionsCount = await this.countReferralConversions(
      businessId,
      customerId,
    );

    return {
      referralCode,
      shareUrl: buildReferralShareUrl(frontendUrl, business.slug, referralCode),
      enabled: settings.enabled,
      referrerBonusPoints: settings.referrerBonusPoints,
      refereeBonusPoints: settings.refereeBonusPoints,
      refereePromoCode: settings.refereePromoCode,
      conversionsCount,
    };
  }

  async claimReferralCode(
    businessId: string,
    refereeCustomerId: string,
    referralCodeRaw: string,
  ): Promise<ReferralClaimResult> {
    const business = await this.requireBusiness(businessId);
    const settings = mergeReferralProgramSettings(business.settings);
    if (!settings.enabled) {
      return { attached: false, reason: 'disabled' };
    }

    const referralCode = normalizeReferralCode(referralCodeRaw);
    if (!referralCode) {
      return { attached: false, reason: 'invalid_code' };
    }

    const referee = await this.customerRepo.findOne({
      where: { id: refereeCustomerId, businessId },
    });
    if (!referee) {
      return { attached: false, reason: 'invalid_code' };
    }

    if (readReferredByCustomerId(referee.metadata)) {
      return { attached: false, reason: 'already_attached', referralCode };
    }

    const referrerCustomerId = await this.resolveReferrerCustomerId(
      businessId,
      referralCode,
    );
    if (!referrerCustomerId) {
      return { attached: false, reason: 'invalid_code', referralCode };
    }
    if (!canSelfRefer(referrerCustomerId, refereeCustomerId)) {
      return { attached: false, reason: 'self_referral', referralCode };
    }

    referee.metadata = {
      ...(referee.metadata ?? {}),
      ...buildReferralAttributionMetadata({ referrerCustomerId, referralCode }),
    };
    await this.customerRepo.save(referee);

    return { attached: true, referralCode, referrerCustomerId };
  }

  async processBookingCompleted(bookingId: string): Promise<ReferralConversionResult> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { customer: true, business: true },
    });
    if (!booking?.customerId || !booking.customer) {
      return { converted: false, bookingId, reason: 'no_customer' };
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      return { converted: false, bookingId, reason: 'not_completed' };
    }

    const settings = mergeReferralProgramSettings(booking.business?.settings);
    if (!settings.enabled) {
      return { converted: false, bookingId, reason: 'disabled' };
    }

    const referrerCustomerId = readReferredByCustomerId(booking.customer.metadata);
    if (!referrerCustomerId) {
      return { converted: false, bookingId, reason: 'no_referrer' };
    }
    if (hasReferralConversion(booking.customer.metadata)) {
      return { converted: false, bookingId, reason: 'already_converted' };
    }

    const priorCompleted = await this.bookingRepo.count({
      where: {
        businessId: booking.businessId,
        customerId: booking.customerId,
        status: BookingStatus.COMPLETED,
      },
    });
    if (priorCompleted !== 1) {
      return { converted: false, bookingId, reason: 'not_first_completion' };
    }

    const refereeBonus = settings.refereeBonusPoints;
    const referrerBonus = settings.referrerBonusPoints;

    if (refereeBonus > 0) {
      await this.loyaltyService.awardFlatBonus(
        booking.businessId,
        booking.customerId,
        refereeBonus,
        `Referral welcome bonus (${booking.id})`,
      );
    }

    if (referrerBonus > 0) {
      await this.loyaltyService.awardFlatBonus(
        booking.businessId,
        referrerCustomerId,
        referrerBonus,
        `Referral bonus for friend ${booking.customerId} (${booking.id})`,
      );
    }

    booking.customer.metadata = {
      ...(booking.customer.metadata ?? {}),
      ...buildReferralConversionMetadata({ bookingId: booking.id }),
    };
    await this.customerRepo.save(booking.customer);

    this.logger.log(
      `Referral converted booking=${booking.id} referrer=${referrerCustomerId} referee=${booking.customerId}`,
    );

    return {
      converted: true,
      bookingId,
      referrerCustomerId,
      referrerBonusPoints: referrerBonus,
      refereeBonusPoints: refereeBonus,
    };
  }

  private async resolveReferrerCustomerId(
    businessId: string,
    referralCode: string,
  ): Promise<string | null> {
    const rows = await this.customerRepo
      .createQueryBuilder('customer')
      .select('customer.id', 'id')
      .where('customer.businessId = :businessId', { businessId })
      .andWhere('customer.isActive = true')
      .getRawMany<{ id: string }>();

    const ids = rows.map((row) => row.id);
    const normalized = normalizeReferralCode(referralCode);
    if (!normalized) return null;

    const matches = ids.filter(
      (id) => deriveReferralCodeFromCustomerId(id) === normalized,
    );
    return matches.length === 1 ? matches[0]! : null;
  }

  private async countReferralConversions(
    businessId: string,
    referrerCustomerId: string,
  ): Promise<number> {
    const rows = await this.customerRepo.find({
      where: { businessId, isActive: true },
      select: { id: true, metadata: true },
    });
    return rows.filter(
      (row) => readReferredByCustomerId(row.metadata) === referrerCustomerId,
    ).filter((row) => hasReferralConversion(row.metadata)).length;
  }

  private async requireBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business?.slug) {
      throw new Error('Business not found');
    }
    return business;
  }
}
