import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import { getBusinessDefaultCurrency } from '../../common/utils/business-currency.util.js';
import {
  buildShareRewardSummary,
  channelSettingsFor,
  isShareChannelEnabled,
  isShareRewardEligible,
  mergeShareRewardsSettings,
  nextShareRewardEligibleAt,
  readShareRewardLastAt,
  shareRewardMetadataKey,
  type ShareRewardChannel,
  type ShareRewardKind,
} from '../../common/utils/share-rewards.util.js';

export interface PublicShareRewardsView {
  enabled: boolean;
  salonShareEnabled: boolean;
  bookingShareEnabled: boolean;
  salonRewardSummary: string;
  bookingRewardSummary: string;
  cooldownHours: number;
  salonNextEligibleAt: string | null;
  bookingNextEligibleAt: string | null;
}

export interface ShareRewardClaimResult {
  awarded: boolean;
  channel: ShareRewardChannel;
  rewardType?: ShareRewardKind;
  rewardSummary?: string;
  loyaltyPoints?: number;
  giftCardId?: string;
  nextEligibleAt?: string | null;
  reason?:
    | 'disabled'
    | 'cooldown'
    | 'booking_not_found'
    | 'booking_not_shareable'
    | 'no_reward';
}

@Injectable()
export class ShareRewardService {
  private readonly logger = new Logger(ShareRewardService.name);

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    private loyaltyService: LoyaltyService,
    private giftCardsService: GiftCardsService,
  ) {}

  async getShareRewardsView(
    businessId: string,
    customerId: string,
  ): Promise<PublicShareRewardsView> {
    const business = await this.requireBusiness(businessId);
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId },
    });
    const settings = mergeShareRewardsSettings(business.settings);
    const metadata = customer?.metadata ?? {};

    return {
      enabled: settings.enabled,
      salonShareEnabled: isShareChannelEnabled(settings, 'salon'),
      bookingShareEnabled: isShareChannelEnabled(settings, 'booking'),
      salonRewardSummary: buildShareRewardSummary(
        settings.salon,
        business.settings,
      ),
      bookingRewardSummary: buildShareRewardSummary(
        settings.booking,
        business.settings,
      ),
      cooldownHours: settings.cooldownHours,
      salonNextEligibleAt: nextShareRewardEligibleAt(
        readShareRewardLastAt(metadata, 'salon'),
        settings.cooldownHours,
      ),
      bookingNextEligibleAt: nextShareRewardEligibleAt(
        readShareRewardLastAt(metadata, 'booking'),
        settings.cooldownHours,
      ),
    };
  }

  async claimShareReward(
    businessId: string,
    customerId: string,
    channel: ShareRewardChannel,
    bookingId?: string,
  ): Promise<ShareRewardClaimResult> {
    const business = await this.requireBusiness(businessId);
    const settings = mergeShareRewardsSettings(business.settings);
    if (!isShareChannelEnabled(settings, channel)) {
      return { awarded: false, channel, reason: 'disabled' };
    }

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId },
    });
    if (!customer) {
      return { awarded: false, channel, reason: 'disabled' };
    }

    if (channel === 'booking') {
      const bookingCheck = await this.assertShareableBooking(
        businessId,
        customerId,
        bookingId,
      );
      if (!bookingCheck.ok) {
        return { awarded: false, channel, reason: bookingCheck.reason };
      }
    }

    const lastAt = readShareRewardLastAt(customer.metadata, channel);
    if (!isShareRewardEligible(lastAt, settings.cooldownHours)) {
      return {
        awarded: false,
        channel,
        reason: 'cooldown',
        nextEligibleAt: nextShareRewardEligibleAt(
          lastAt,
          settings.cooldownHours,
        ),
      };
    }

    const channelSettings = channelSettingsFor(settings, channel);
    const issued = await this.issueReward(
      businessId,
      customerId,
      channel,
      channelSettings,
      business.settings,
      bookingId,
    );
    if (!issued) {
      return { awarded: false, channel, reason: 'no_reward' };
    }

    const claimedAt = new Date().toISOString();
    customer.metadata = {
      ...(customer.metadata ?? {}),
      [shareRewardMetadataKey(channel)]: claimedAt,
    };
    await this.customerRepo.save(customer);

    const rewardSummary = buildShareRewardSummary(
      channelSettings,
      business.settings,
    );
    this.logger.log(
      `Share reward claimed channel=${channel} customer=${customerId} business=${businessId}`,
    );

    return {
      awarded: true,
      channel,
      rewardType: channelSettings.rewardType,
      rewardSummary,
      loyaltyPoints: issued.loyaltyPoints,
      giftCardId: issued.giftCardId,
      nextEligibleAt: nextShareRewardEligibleAt(
        claimedAt,
        settings.cooldownHours,
      ),
    };
  }

  private async assertShareableBooking(
    businessId: string,
    customerId: string,
    bookingId?: string,
  ): Promise<
    | { ok: true }
    | { ok: false; reason: 'booking_not_found' | 'booking_not_shareable' }
  > {
    if (!bookingId?.trim()) {
      return { ok: false, reason: 'booking_not_found' };
    }
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId.trim(), businessId, customerId },
    });
    if (!booking) return { ok: false, reason: 'booking_not_found' };
    const status = String(booking.status).toLowerCase();
    if (
      status !== BookingStatus.CONFIRMED &&
      status !== BookingStatus.COMPLETED
    ) {
      return { ok: false, reason: 'booking_not_shareable' };
    }
    return { ok: true };
  }

  private async issueReward(
    businessId: string,
    customerId: string,
    channel: ShareRewardChannel,
    channelSettings: ReturnType<typeof channelSettingsFor>,
    businessSettings: Record<string, unknown> | null | undefined,
    bookingId?: string,
  ): Promise<{ loyaltyPoints?: number; giftCardId?: string } | null> {
    const label =
      channel === 'salon'
        ? 'Salon share reward'
        : `Booking share reward${bookingId ? ` (${bookingId})` : ''}`;

    if (channelSettings.rewardType === 'gift_card') {
      const amount = channelSettings.giftCardAmount;
      if (amount <= 0) return null;
      const currency = getBusinessDefaultCurrency(businessSettings);
      const card = await this.giftCardsService.create(businessId, {
        amount,
        currency,
        purchaserCustomerId: customerId,
      });
      return { giftCardId: card.id };
    }

    const points = channelSettings.loyaltyPoints;
    if (points <= 0) return null;
    await this.loyaltyService.awardFlatBonus(
      businessId,
      customerId,
      points,
      label,
    );
    return { loyaltyPoints: points };
  }

  private async requireBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business?.slug) throw new Error('Business not found');
    return business;
  }
}
