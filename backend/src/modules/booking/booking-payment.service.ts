import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingCheckoutDraft } from './entities/booking-checkout-draft.entity.js';
import { Service, PrepaymentMode } from '../service/entities/service.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { StripeService } from '../billing/stripe.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { CustomerService } from '../customer/customer.service.js';
import { BookingService } from './booking.service.js';
import { CreatePublicBookingDto } from '../public-booking/dto/public-booking.dto.js';
import { PaymentStatus } from './entities/booking.entity.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';

interface StripeCheckoutSession {
  id?: string;
  metadata?: Record<string, string> | null;
  status?: string | null;
  payment_status?: string | null;
}

@Injectable()
export class BookingPaymentService {
  private readonly logger = new Logger(BookingPaymentService.name);

  constructor(
    @InjectRepository(BookingCheckoutDraft)
    private draftRepo: Repository<BookingCheckoutDraft>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private stripeService: StripeService,
    private stripeIntegrationService: StripeIntegrationService,
    private customerService: CustomerService,
    private bookingService: BookingService,
    private eventStore: EventStoreService,
    @Inject(forwardRef(() => PublicBookingService))
    private publicBookingService: PublicBookingService,
  ) {}

  calculatePrepaymentAmount(service: Service): number {
    const price = Number(service.price);
    if (service.prepaymentMode === PrepaymentMode.FULL) {
      return price;
    }
    if (service.prepaymentMode === PrepaymentMode.DEPOSIT) {
      if (service.depositAmount != null && Number(service.depositAmount) > 0) {
        return Math.min(Number(service.depositAmount), price);
      }
      return Math.round(price * 50) / 100;
    }
    return 0;
  }

  requiresPrepayment(service: Service): boolean {
    return (
      service.prepaymentMode !== PrepaymentMode.NONE &&
      this.calculatePrepaymentAmount(service) > 0
    );
  }

  async createCheckoutSession(
    slug: string,
    dto: CreatePublicBookingDto,
  ): Promise<{ url: string; sessionId: string; amount: number; currency: string }> {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Online payments are not configured on the server');
    }

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = await this.stripeIntegrationService.assertCanAcceptOnlinePayments(
      business.id,
    );

    const service = await this.serviceRepo.findOne({
      where: { id: dto.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const amount = this.calculatePrepaymentAmount(service);
    if (amount <= 0) {
      throw new BadRequestException('This service does not require online payment');
    }

    if (!dto.customer.email && !dto.customer.phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const draft = await this.draftRepo.save(
      this.draftRepo.create({
        businessId: business.id,
        payload: dto as unknown as Record<string, unknown>,
        amount,
        currency: service.currency || 'USD',
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        stripeConnectAccountId: connectAccountId,
      }),
    );

    const frontendUrl = this.stripeService.frontendUrl;
    const connectOpts = this.stripeService.connectRequestOptions(connectAccountId);
    const checkoutQuery = new URLSearchParams({
      paid: '1',
      session_id: '{CHECKOUT_SESSION_ID}',
      serviceId: dto.serviceId,
      startTime: dto.startTime,
    });
    if (dto.employeeId) {
      checkoutQuery.set('employeeId', dto.employeeId);
    } else {
      checkoutQuery.set('autoAssign', '1');
    }
    const session = await this.stripeService.client.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: dto.customer.email || undefined,
        line_items: [
          {
            price_data: {
              currency: (service.currency || 'USD').toLowerCase(),
              unit_amount: Math.round(amount * 100),
              product_data: {
                name: service.name,
                description:
                  service.prepaymentMode === PrepaymentMode.DEPOSIT
                    ? `Deposit for ${service.name}`
                    : service.name,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          type: 'booking_payment',
          draftId: draft.id,
          businessId: business.id,
          slug,
          connectAccountId,
        },
        success_url: `${frontendUrl}/book/${slug}/checkout?${checkoutQuery.toString()}`,
        cancel_url: `${frontendUrl}/book/${slug}/checkout?canceled=1&serviceId=${encodeURIComponent(dto.serviceId)}&startTime=${encodeURIComponent(dto.startTime)}${dto.employeeId ? `&employeeId=${encodeURIComponent(dto.employeeId)}` : '&autoAssign=1'}`,
      },
      connectOpts,
    );

    if (!session.url) {
      throw new BadRequestException('Failed to create payment session');
    }

    draft.stripeSessionId = session.id;
    await this.draftRepo.save(draft);

    return {
      url: session.url,
      sessionId: session.id,
      amount,
      currency: service.currency || 'USD',
    };
  }

  async confirmCheckoutSession(slug: string, sessionId: string) {
    if (!this.stripeService.isConfigured) {
      throw new BadRequestException('Stripe is not configured');
    }

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const connectAccountId = this.stripeIntegrationService.resolveConnectAccountId(
      business.settings,
    );
    if (!connectAccountId) {
      throw new BadRequestException('Stripe is not connected for this business');
    }

    const session = await this.stripeService.client.checkout.sessions.retrieve(
      sessionId,
      {},
      this.stripeService.connectRequestOptions(connectAccountId),
    );
    if (session.metadata?.type !== 'booking_payment' || session.metadata.slug !== slug) {
      throw new BadRequestException('Invalid payment session');
    }

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      throw new BadRequestException('Payment is not complete yet');
    }

    return this.fulfillDraft(session.metadata.draftId!, sessionId);
  }

  async handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
    if (session.metadata?.type !== 'booking_payment' || !session.metadata.draftId) {
      return;
    }

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return;
    }

    await this.fulfillDraft(session.metadata.draftId, session.id ?? 'unknown');
  }

  private async fulfillDraft(draftId: string, sessionId: string) {
    const draft = await this.draftRepo.findOne({ where: { id: draftId } });
    if (!draft) {
      this.logger.warn(`Checkout draft ${draftId} not found`);
      return { alreadyCompleted: true };
    }

    if (draft.status === 'completed') {
      return { alreadyCompleted: true };
    }

    const dto = draft.payload as unknown as CreatePublicBookingDto;
    const business = await this.businessRepo.findOne({ where: { id: draft.businessId } });
    if (!business) throw new NotFoundException('Business not found');

    let employeeId = dto.employeeId;
    if (!employeeId) {
      const resolved = await this.publicBookingService.resolveEmployeeForServiceSlot(
        business.slug,
        dto.serviceId,
        dto.startTime,
      );
      if (!resolved) {
        throw new BadRequestException('That time slot is no longer available');
      }
      employeeId = resolved.employeeId;
    }

    const { customer } = await this.customerService.findOrCreateByContact(business.id, {
      name: dto.customer.name,
      email: dto.customer.email,
      phone: dto.customer.phone,
      emailReminders: dto.customer.emailReminders,
      smsReminders: dto.customer.smsReminders,
      whatsappReminders: dto.customer.whatsappReminders,
    });

    const booking = await this.bookingService.create(
      business.id,
      {
        employeeId,
        serviceId: dto.serviceId,
        customerId: customer.id,
        startTime: dto.startTime,
        notes: dto.notes,
        metadata: {
          source: 'public_booking',
          stripeSessionId: sessionId,
          stripeConnectAccountId: draft.stripeConnectAccountId,
          prepaymentAmount: Number(draft.amount),
          ...(dto.metadata || {}),
        },
      },
      undefined,
      { paymentStatus: PaymentStatus.PAID },
    );

    draft.status = 'completed';
    draft.stripeSessionId = sessionId;
    await this.draftRepo.save(draft);

    await this.eventStore.publish({
      eventType: EventType.PAYMENT_RECEIVED,
      aggregateType: 'booking',
      aggregateId: booking.id,
      businessId: business.id,
      payload: {
        bookingId: booking.id,
        customerId: customer.id,
        amount: Number(draft.amount),
        currency: draft.currency,
        stripeSessionId: sessionId,
        source: 'public_booking',
      },
    });

    return {
      alreadyCompleted: false,
      booking,
      customer: { id: customer.id, name: customer.name },
    };
  }
}
