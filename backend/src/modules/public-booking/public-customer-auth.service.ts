import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CUSTOMER_REGISTERED_EVENT } from '../notifications/customer-registration.types.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Review } from '../reviews/entities/review.entity.js';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';
import { BusinessService } from '../business/business.service.js';
import {
  PublicCustomerAuthResponse,
  PublicCustomerBookingItem,
  PublicCustomerJwtPayload,
  PublicCustomerProfile,
} from './public-customer-auth.types.js';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import { GiftCardPurchaseService } from '../gift-cards/gift-card-purchase.service.js';
import { resolveCustomerSelfServiceSettings } from '../../common/utils/customer-self-service.util.js';
import {
  mergeCustomerAnalyticsAnonMetadata,
  readCustomerAnalyticsAnonId,
} from '../../common/utils/customer-analytics-anon.util.js';
import {
  applyCustomerNotificationPreferences,
  hasNotificationPreferenceUpdate,
  mapPublicConsumerNotificationPreferences,
  type UpdatePublicConsumerNotificationPreferencesInput,
} from './public-consumer-notification-preferences.util.js';
import {
  applyCustomerPreferredLocale,
  assertCustomerPreferredLocale,
  readCustomerPreferredLocale,
  resolveCustomerNotificationLocale,
} from '../../common/utils/customer-notification-locale.util.js';
import type { AppLocale } from '../../common/i18n/messages.js';

@Injectable()
export class PublicCustomerAuthService {
  constructor(
    private businessService: BusinessService,
    private jwtService: JwtService,
    private firebase: FirebaseAdminService,
    private publicCustomerBookingService: PublicCustomerBookingService,
    private giftCardPurchaseService: GiftCardPurchaseService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  async loginWithApple(
    slug: string,
    idToken: string,
    analyticsAnonId?: string,
    preferredLocale?: string,
  ): Promise<PublicCustomerAuthResponse> {
    return this.loginWithOAuthIdToken(
      slug,
      idToken,
      'apple',
      analyticsAnonId,
      preferredLocale,
    );
  }

  async loginWithPhone(
    slug: string,
    idToken: string,
    analyticsAnonId?: string,
    preferredLocale?: string,
  ): Promise<PublicCustomerAuthResponse> {
    if (!this.firebase.isReady) {
      throw new BadRequestException(
        'Phone sign-in is not configured on the server',
      );
    }

    let decoded;
    try {
      decoded = await this.firebase.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid phone sign-in token');
    }

    const phone = String(decoded.phone_number ?? '').trim();
    if (!phone) {
      throw new UnauthorizedException(
        'Phone sign-in token has no phone number',
      );
    }

    const business = await this.resolveBusiness(slug);
    const email = decoded.email?.trim().toLowerCase() ?? null;
    const name =
      decoded.name?.trim() ||
      [decoded.given_name, decoded.family_name]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      phone;

    let customer = await this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.business_id = :businessId', { businessId: business.id })
      .andWhere('customer.isActive = :isActive', { isActive: true })
      .andWhere('customer.phone = :phone', { phone })
      .getOne();

    if (!customer && email) {
      customer = await this.customerRepo
        .createQueryBuilder('customer')
        .where('customer.business_id = :businessId', {
          businessId: business.id,
        })
        .andWhere('customer.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(customer.email) = :email', { email })
        .getOne();
    }

    if (!customer) {
      customer = await this.customerRepo.save(
        this.customerRepo.create({
          businessId: business.id,
          name,
          email,
          phone,
          metadata: {
            authProvider: 'phone',
            phoneSub: decoded.uid,
          },
        }),
      );
      this.eventEmitter.emit(CUSTOMER_REGISTERED_EVENT, {
        businessId: business.id,
        customerId: customer.id,
        source: 'app',
      });
      this.eventEmitter.emit('customer.upserted', {
        businessId: business.id,
        customerId: customer.id,
      });
    } else {
      const metadata = { ...(customer.metadata || {}) };
      let dirty = false;
      if (name && customer.name !== name) {
        customer.name = name;
        dirty = true;
      }
      if (!customer.phone) {
        customer.phone = phone;
        dirty = true;
      }
      if (email && !customer.email) {
        customer.email = email;
        dirty = true;
      }
      if (!metadata.phoneSub) {
        metadata.phoneSub = decoded.uid;
        metadata.authProvider = 'phone';
        dirty = true;
      }
      if (dirty) {
        customer.metadata = metadata;
        customer = await this.customerRepo.save(customer);
      }
    }

    if (email) {
      await this.giftCardPurchaseService.linkGuestPurchasesToCustomer(
        business.id,
        customer.id,
        email,
      );
    }
    await this.linkGuestBookingsToCustomer(
      business.id,
      customer.id,
      customer.email ?? email ?? '',
      phone,
    );

    const token = this.signToken(
      customer,
      business.id,
      this.resolveCustomerJwtEmail(customer, phone),
    );
    customer = await this.linkAnalyticsAnonForCustomer(
      customer,
      analyticsAnonId,
    );
    customer = await this.syncPreferredLocaleForCustomer(
      customer,
      business,
      preferredLocale,
    );
    return { token, customer: this.toProfile(customer) };
  }

  async loginWithGoogle(
    slug: string,
    idToken: string,
    analyticsAnonId?: string,
    preferredLocale?: string,
  ): Promise<PublicCustomerAuthResponse> {
    return this.loginWithOAuthIdToken(
      slug,
      idToken,
      'google',
      analyticsAnonId,
      preferredLocale,
    );
  }

  private async loginWithOAuthIdToken(
    slug: string,
    idToken: string,
    provider: 'google' | 'apple',
    analyticsAnonId?: string,
    preferredLocale?: string,
  ): Promise<PublicCustomerAuthResponse> {
    if (!this.firebase.isReady) {
      throw new BadRequestException(
        `${provider === 'apple' ? 'Apple' : 'Google'} sign-in is not configured on the server`,
      );
    }

    let decoded;
    try {
      decoded = await this.firebase.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException(`Invalid ${provider} sign-in token`);
    }

    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException(`${provider} account has no email`);
    }

    const business = await this.resolveBusiness(slug);
    const name =
      decoded.name?.trim() ||
      [decoded.given_name, decoded.family_name]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      email.split('@')[0];

    let customer = await this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.business_id = :businessId', { businessId: business.id })
      .andWhere('customer.isActive = :isActive', { isActive: true })
      .andWhere('LOWER(customer.email) = :email', { email })
      .getOne();

    if (!customer) {
      customer = await this.customerRepo.save(
        this.customerRepo.create({
          businessId: business.id,
          name,
          email,
          metadata: {
            authProvider: provider,
            [`${provider}Sub`]: decoded.uid,
            photoUrl: decoded.picture ?? null,
          },
        }),
      );
      this.eventEmitter.emit(CUSTOMER_REGISTERED_EVENT, {
        businessId: business.id,
        customerId: customer.id,
        source: 'app',
      });
      this.eventEmitter.emit('customer.upserted', {
        businessId: business.id,
        customerId: customer.id,
      });
    } else {
      const metadata = { ...(customer.metadata || {}) };
      let dirty = false;
      if (name && customer.name !== name) {
        customer.name = name;
        dirty = true;
      }
      const providerSubKey = provider === 'apple' ? 'appleSub' : 'googleSub';
      if (!metadata[providerSubKey]) {
        metadata[providerSubKey] = decoded.uid;
        metadata.authProvider = provider;
        dirty = true;
      }
      if (decoded.picture && metadata.photoUrl !== decoded.picture) {
        metadata.photoUrl = decoded.picture;
        dirty = true;
      }
      if (dirty) {
        customer.metadata = metadata;
        customer = await this.customerRepo.save(customer);
      }
    }

    await this.giftCardPurchaseService.linkGuestPurchasesToCustomer(
      business.id,
      customer.id,
      email,
    );
    await this.linkGuestBookingsToCustomer(
      business.id,
      customer.id,
      email,
      customer.phone,
    );

    const token = this.signToken(customer, business.id, email);
    customer = await this.linkAnalyticsAnonForCustomer(
      customer,
      analyticsAnonId,
    );
    customer = await this.syncPreferredLocaleForCustomer(
      customer,
      business,
      preferredLocale,
    );
    return { token, customer: this.toProfile(customer) };
  }

  async linkAnalyticsAnonForCustomer(
    customer: Customer,
    analyticsAnonId?: string | null,
  ): Promise<Customer> {
    const anon = analyticsAnonId?.trim();
    if (!anon) return customer;
    if (readCustomerAnalyticsAnonId(customer.metadata) === anon)
      return customer;
    customer.metadata = mergeCustomerAnalyticsAnonMetadata(
      customer.metadata,
      anon,
    );
    return this.customerRepo.save(customer);
  }

  async linkAnalyticsAnonByCustomerId(
    businessId: string,
    customerId: string,
    analyticsAnonId?: string | null,
  ): Promise<void> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) return;
    await this.linkAnalyticsAnonForCustomer(customer, analyticsAnonId);
  }

  private resolveCustomerJwtEmail(
    customer: Customer,
    phone?: string | null,
  ): string {
    const email = customer.email?.trim().toLowerCase();
    if (email) return email;
    const digits = String(phone ?? customer.phone ?? '').replace(/\D/g, '');
    return `${digits || 'unknown'}@phone.local`;
  }

  async linkGuestBookingsToCustomer(
    businessId: string,
    customerId: string,
    email: string,
    phone?: string | null,
  ): Promise<number> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone?.trim() || null;
    if (!normalizedEmail && !normalizedPhone) return 0;

    const duplicateQuery = this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.business_id = :businessId', { businessId })
      .andWhere('customer.id != :customerId', { customerId })
      .andWhere('customer.isActive = :isActive', { isActive: true });

    if (normalizedEmail && normalizedPhone) {
      duplicateQuery.andWhere(
        '(LOWER(customer.email) = :email OR customer.phone = :phone)',
        { email: normalizedEmail, phone: normalizedPhone },
      );
    } else if (normalizedEmail) {
      duplicateQuery.andWhere('LOWER(customer.email) = :email', {
        email: normalizedEmail,
      });
    } else {
      duplicateQuery.andWhere('customer.phone = :phone', {
        phone: normalizedPhone,
      });
    }

    const duplicates = await duplicateQuery.getMany();
    if (duplicates.length === 0) return 0;

    const duplicateIds = duplicates.map((entry) => entry.id);
    await this.bookingRepo
      .createQueryBuilder()
      .update(Booking)
      .set({ customerId })
      .where('business_id = :businessId', { businessId })
      .andWhere('customer_id IN (:...duplicateIds)', { duplicateIds })
      .execute();

    await this.customerRepo.update(
      { id: In(duplicateIds) },
      { isActive: false },
    );
    return duplicateIds.length;
  }

  getProfile(customer: Customer): PublicCustomerProfile {
    return this.toProfile(customer);
  }

  async getCustomerById(
    businessId: string,
    customerId: string,
  ): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) throw new UnauthorizedException('Customer session expired');
    return customer;
  }

  async getNotificationPreferences(slug: string, customerId: string) {
    const business = await this.resolveBusiness(slug);
    const customer = await this.getCustomerById(business.id, customerId);
    return mapPublicConsumerNotificationPreferences(customer.metadata);
  }

  async updateNotificationPreferences(
    slug: string,
    customerId: string,
    input: UpdatePublicConsumerNotificationPreferencesInput,
  ) {
    if (!hasNotificationPreferenceUpdate(input)) {
      throw new BadRequestException(
        'No notification preference fields provided',
      );
    }
    const business = await this.resolveBusiness(slug);
    const customer = await this.getCustomerById(business.id, customerId);
    customer.metadata = applyCustomerNotificationPreferences(
      customer.metadata,
      input,
    );
    await this.customerRepo.save(customer);
    return mapPublicConsumerNotificationPreferences(customer.metadata);
  }

  async getPreferredLocale(slug: string, customerId: string) {
    const business = await this.resolveBusiness(slug);
    const customer = await this.getCustomerById(business.id, customerId);
    return this.mapCustomerPreferredLocaleView(customer, business.settings);
  }

  async updatePreferredLocale(
    slug: string,
    customerId: string,
    preferredLocale: string,
  ) {
    const business = await this.resolveBusiness(slug);
    const customer = await this.getCustomerById(business.id, customerId);
    const normalized = assertCustomerPreferredLocale(
      preferredLocale,
      business.settings as Record<string, unknown> | undefined,
    );
    if (readCustomerPreferredLocale(customer.metadata) === normalized) {
      return this.mapCustomerPreferredLocaleView(customer, business.settings);
    }
    customer.metadata = applyCustomerPreferredLocale(
      customer.metadata,
      normalized,
    );
    await this.customerRepo.save(customer);
    return this.mapCustomerPreferredLocaleView(customer, business.settings);
  }

  private mapCustomerPreferredLocaleView(
    customer: Customer,
    businessSettings?: Record<string, unknown>,
  ): { preferredLocale: AppLocale; storedLocale: AppLocale | null } {
    const storedLocale = readCustomerPreferredLocale(customer.metadata);
    return {
      preferredLocale: resolveCustomerNotificationLocale(
        customer.metadata,
        businessSettings,
      ),
      storedLocale,
    };
  }

  private async syncPreferredLocaleForCustomer(
    customer: Customer,
    business: Business,
    preferredLocale?: string | null,
  ): Promise<Customer> {
    const raw = preferredLocale?.trim();
    if (!raw) return customer;
    const normalized = assertCustomerPreferredLocale(
      raw,
      business.settings as Record<string, unknown> | undefined,
    );
    if (readCustomerPreferredLocale(customer.metadata) === normalized) {
      return customer;
    }
    customer.metadata = applyCustomerPreferredLocale(
      customer.metadata,
      normalized,
    );
    return this.customerRepo.save(customer);
  }

  async listBookings(
    slug: string,
    customerId: string,
  ): Promise<{ bookings: PublicCustomerBookingItem[] }> {
    const business = await this.resolveBusiness(slug);
    await this.getCustomerById(business.id, customerId);

    const bookings = await this.bookingRepo.find({
      where: { businessId: business.id, customerId },
      relations: { employee: true, service: true },
      order: { startTime: 'DESC' },
      take: 100,
    });

    const reviewBookingIds = new Set<string>();
    if (bookings.length > 0) {
      const bookingIds = bookings.map((b) => b.id);
      const reviews = await this.reviewRepo.find({
        where: {
          businessId: business.id,
          customerId,
          bookingId: In(bookingIds),
        },
      });
      for (const review of reviews) {
        if (review.bookingId) reviewBookingIds.add(review.bookingId);
      }
    }

    const settings = resolveCustomerSelfServiceSettings(business.settings);

    return {
      bookings: bookings.map((booking) =>
        this.publicCustomerBookingService.enrichBookingItem(
          booking,
          settings,
          reviewBookingIds,
        ),
      ),
    };
  }

  signToken(customer: Customer, businessId: string, email: string): string {
    const payload: PublicCustomerJwtPayload = {
      sub: customer.id,
      email: email.toLowerCase(),
      businessId,
      type: 'public_customer',
    };
    return this.jwtService.sign(payload);
  }

  private toProfile(customer: Customer): PublicCustomerProfile {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
    };
  }

  private async resolveBusiness(slug: string): Promise<Business> {
    const business = await this.businessService.findBySlug(slug);
    if (!business.isActive) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}
