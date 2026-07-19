import { buildTenantPublicUrl } from '../../common/utils/tenant-public-url.util.js';
import { assertUuid } from '../../common/utils/uuid-param.util.js';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { randomBytes } from 'crypto';
import { Review } from './entities/review.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SubmitPublicReviewDto } from './dto/submit-public-review.dto.js';
import { SubmitProviderPortalReviewDto } from './dto/submit-provider-portal-review.dto.js';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';

export interface PublicReviewContext {
  businessName: string;
  employeeName: string;
  serviceName: string;
  customerName: string;
  appointmentDate: string;
  /** e2e-bug.59 — real end time so the review page can show a non-zero range */
  appointmentEndDate: string;
  alreadySubmitted: boolean;
}

export interface PublicProviderReview {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface PublicProviderReviewSummary {
  averageRating: number | null;
  reviewCount: number;
  recentReviews: PublicProviderReview[];
}

export interface PublicProviderReviewsPage {
  employeeId: string;
  employeeName: string;
  employeeRole: string | null;
  avatarUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: PublicProviderReview[];
}

export const PUBLIC_PROVIDER_REVIEWS_PREVIEW_LIMIT = 3;
export const PUBLIC_PROVIDER_REVIEWS_PAGE_SIZE = 15;

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private firebase: FirebaseAdminService,
    private eventStore: EventStoreService,
  ) {}

  async list(businessId: string, employeeId?: string): Promise<Review[]> {
    const where: Record<string, string> = { businessId };
    if (employeeId) where.employeeId = employeeId;
    return this.reviewRepo.find({
      where,
      relations: { employee: true, customer: true },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async hasSubmittedReviewForBooking(
    businessId: string,
    bookingId: string,
  ): Promise<boolean> {
    const existing = await this.reviewRepo.findOne({
      where: { businessId, bookingId },
      select: { id: true },
    });
    return Boolean(existing);
  }

  async getPublicReviewsByEmployees(
    businessId: string,
    employeeIds: string[],
    recentLimit = PUBLIC_PROVIDER_REVIEWS_PREVIEW_LIMIT,
  ): Promise<Map<string, PublicProviderReviewSummary>> {
    const result = new Map<string, PublicProviderReviewSummary>();
    if (employeeIds.length === 0) return result;

    for (const employeeId of employeeIds) {
      result.set(employeeId, {
        averageRating: null,
        reviewCount: 0,
        recentReviews: [],
      });
    }

    const aggregates = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.employee_id', 'employeeId')
      .addSelect('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'count')
      .where('r.business_id = :businessId', { businessId })
      .andWhere('r.employee_id IN (:...employeeIds)', { employeeIds })
      .groupBy('r.employee_id')
      .getRawMany<{ employeeId: string; avgRating: string; count: string }>();

    for (const row of aggregates) {
      result.set(row.employeeId, {
        averageRating: Math.round(parseFloat(row.avgRating) * 10) / 10,
        reviewCount: parseInt(row.count, 10),
        recentReviews: [],
      });
    }

    const recentAll = await this.reviewRepo.find({
      where: { businessId, employeeId: In(employeeIds) },
      order: { createdAt: 'DESC' },
      take: employeeIds.length * recentLimit,
    });

    const recentByEmployee = new Map<string, Review[]>();
    for (const review of recentAll) {
      const list = recentByEmployee.get(review.employeeId) ?? [];
      if (list.length < recentLimit) {
        list.push(review);
        recentByEmployee.set(review.employeeId, list);
      }
    }

    for (const employeeId of employeeIds) {
      const summary = result.get(employeeId);
      if (!summary || summary.reviewCount === 0) continue;
      summary.recentReviews = (recentByEmployee.get(employeeId) ?? []).map(
        (r) => this.toPublicProviderReview(r),
      );
    }

    return result;
  }

  async listPublicProviderReviews(
    slug: string,
    employeeId: string,
    page = 1,
    limit = PUBLIC_PROVIDER_REVIEWS_PAGE_SIZE,
  ): Promise<PublicProviderReviewsPage> {
    // api-bug.3 — reject non-UUID path params before Postgres uuid columns 500.
    this.assertEmployeeIdUuid(employeeId);

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId: business.id, isActive: true },
    });
    if (!employee) throw new NotFoundException('Provider not found');

    const safeLimit = Math.min(
      Math.max(1, limit),
      PUBLIC_PROVIDER_REVIEWS_PAGE_SIZE,
    );
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    const [reviews, reviewCount] = await this.reviewRepo.findAndCount({
      where: { businessId: business.id, employeeId },
      order: { createdAt: 'DESC' },
      skip,
      take: safeLimit,
    });

    const avgRow = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .where('r.business_id = :businessId', { businessId: business.id })
      .andWhere('r.employee_id = :employeeId', { employeeId })
      .getRawOne<{ avgRating: string | null }>();

    const metadata = employee.metadata || {};
    const averageRating = avgRow?.avgRating
      ? Math.round(parseFloat(avgRow.avgRating) * 10) / 10
      : null;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: metadata.role || metadata.title || null,
      avatarUrl: metadata.avatarUrl || null,
      averageRating,
      reviewCount,
      page: safePage,
      limit: safeLimit,
      totalPages: reviewCount === 0 ? 0 : Math.ceil(reviewCount / safeLimit),
      items: reviews.map((r) => this.toPublicProviderReview(r)),
    };
  }

  private assertEmployeeIdUuid(employeeId: string): void {
    if (!isUUID(employeeId)) {
      throw new BadRequestException('employeeId must be a valid UUID');
    }
  }

  private toPublicProviderReview(review: Review): PublicProviderReview {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment?.trim() || null,
      customerName: review.customerName?.trim() || null,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async summary(businessId: string) {
    const rows = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.employee_id', 'employeeId')
      .addSelect('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'count')
      .where('r.business_id = :businessId', { businessId })
      .groupBy('r.employee_id')
      .getRawMany<{ employeeId: string; avgRating: string; count: string }>();

    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const nameMap = new Map(employees.map((e) => [e.id, e.name]));

    return rows.map((r) => ({
      employeeId: r.employeeId,
      employeeName: nameMap.get(r.employeeId) ?? 'Unknown',
      avgRating: Math.round(parseFloat(r.avgRating) * 10) / 10,
      reviewCount: parseInt(r.count, 10),
    }));
  }

  async create(
    businessId: string,
    dto: {
      employeeId: string;
      rating: number;
      comment?: string;
      customerId?: string;
      bookingId?: string;
      customerName?: string;
    },
  ): Promise<Review> {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    const employee = await this.employeeRepo.findOne({
      where: { id: dto.employeeId, businessId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    if (dto.bookingId) {
      const existing = await this.reviewRepo.findOne({
        where: { businessId, bookingId: dto.bookingId },
      });
      if (existing)
        throw new ConflictException(
          'A review was already submitted for this appointment',
        );
    }

    const review = await this.reviewRepo.save(
      this.reviewRepo.create({
        businessId,
        employeeId: dto.employeeId,
        rating: dto.rating,
        comment: dto.comment?.trim() || undefined,
        customerId: dto.customerId || undefined,
        bookingId: dto.bookingId || undefined,
        customerName: dto.customerName?.trim() || undefined,
      }),
    );

    await this.eventStore.publish({
      eventType: EventType.REVIEW_RECEIVED,
      aggregateType: 'review',
      aggregateId: review.id,
      businessId,
      payload: {
        reviewId: review.id,
        employeeId: review.employeeId,
        rating: review.rating,
        comment: review.comment,
        customerId: review.customerId,
        bookingId: review.bookingId,
        customerName: review.customerName,
      },
    });

    return review;
  }

  async ensureReviewToken(bookingId: string): Promise<string> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const metadata = { ...(booking.metadata || {}) };
    if (metadata.reviewToken && typeof metadata.reviewToken === 'string') {
      return metadata.reviewToken;
    }

    const token = randomBytes(24).toString('hex');
    metadata.reviewToken = token;
    booking.metadata = metadata;
    await this.bookingRepo.save(booking);
    return token;
  }

  buildReviewUrl(slug: string, bookingId: string, token: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return buildTenantPublicUrl({
      slug,
      frontendUrl,
      rootDomain: process.env.ROOT_DOMAIN,
      pathSuffix: '/review',
      query: { bookingId, token },
    });
  }

  async getPublicContext(
    slug: string,
    bookingId: string,
    token: string,
  ): Promise<PublicReviewContext> {
    const booking = await this.loadBookingForReview(slug, bookingId, token);
    const existing = await this.reviewRepo.findOne({
      where: { businessId: booking.businessId, bookingId: booking.id },
    });

    const endTime = booking.endTime ?? booking.startTime;
    return {
      businessName: booking.business.name,
      employeeName: booking.employee?.name ?? 'Provider',
      serviceName: booking.service?.name ?? 'Appointment',
      customerName: booking.customer?.name ?? 'Guest',
      appointmentDate: booking.startTime.toISOString(),
      appointmentEndDate: endTime.toISOString(),
      alreadySubmitted: Boolean(
        existing || booking.metadata?.reviewSubmittedAt,
      ),
    };
  }

  async submitPublic(
    slug: string,
    dto: SubmitPublicReviewDto,
  ): Promise<Review> {
    const booking = await this.loadBookingForReview(
      slug,
      dto.bookingId,
      dto.token,
    );

    if (booking.metadata?.reviewSubmittedAt) {
      throw new ConflictException(
        'A review was already submitted for this appointment',
      );
    }

    const existing = await this.reviewRepo.findOne({
      where: { businessId: booking.businessId, bookingId: booking.id },
    });
    if (existing)
      throw new ConflictException(
        'A review was already submitted for this appointment',
      );

    const review = await this.create(booking.businessId, {
      employeeId: booking.employeeId,
      rating: dto.rating,
      comment: dto.comment,
      customerId: booking.customerId,
      bookingId: booking.id,
      customerName: dto.customerName?.trim() || booking.customer?.name,
    });

    booking.metadata = {
      ...(booking.metadata || {}),
      reviewSubmittedAt: new Date().toISOString(),
    };
    await this.bookingRepo.save(booking);

    return review;
  }

  async submitProviderPortalReview(
    slug: string,
    employeeId: string,
    dto: SubmitProviderPortalReviewDto,
    authenticatedCustomerId?: string,
  ): Promise<PublicProviderReview> {
    // api-bug.3 — same UUID guard as listPublicProviderReviews.
    this.assertEmployeeIdUuid(employeeId);

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, businessId: business.id, isActive: true },
    });
    if (!employee) throw new NotFoundException('Provider not found');

    let customer: Customer | null = null;
    let customerName: string | undefined;

    if (authenticatedCustomerId) {
      customer = await this.customerRepo.findOne({
        where: {
          id: authenticatedCustomerId,
          businessId: business.id,
          isActive: true,
        },
      });
      if (!customer)
        throw new UnauthorizedException('Customer session expired');
      customerName = customer.name;
    } else {
      if (!dto.idToken) {
        throw new BadRequestException('Sign in with Google to submit a review');
      }
      if (!this.firebase.isReady) {
        throw new BadRequestException(
          'Google sign-in is not configured on the server',
        );
      }

      let decoded;
      try {
        decoded = await this.firebase.verifyIdToken(dto.idToken);
      } catch {
        throw new UnauthorizedException('Invalid Google sign-in token');
      }

      const email = decoded.email?.trim().toLowerCase();
      if (!email) {
        throw new UnauthorizedException('Google account has no email');
      }

      customerName =
        decoded.name?.trim() ||
        [decoded.given_name, decoded.family_name]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        email.split('@')[0];

      customer = await this.customerRepo
        .createQueryBuilder('customer')
        .where('customer.business_id = :businessId', {
          businessId: business.id,
        })
        .andWhere('customer.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(customer.email) = :email', { email })
        .getOne();

      if (!customer) {
        throw new BadRequestException(
          'No appointment found for this Google account. Book and complete a visit first.',
        );
      }
    }

    const existingReview = await this.reviewRepo.findOne({
      where: { businessId: business.id, employeeId, customerId: customer.id },
    });
    if (existingReview) {
      throw new ConflictException('You have already reviewed this specialist');
    }

    const booking = await this.bookingRepo.findOne({
      where: {
        businessId: business.id,
        customerId: customer.id,
        employeeId,
        status: BookingStatus.COMPLETED,
      },
      order: { startTime: 'DESC' },
    });

    if (!booking) {
      throw new BadRequestException(
        'Reviews are available after you complete an appointment with this specialist',
      );
    }

    const review = await this.create(business.id, {
      employeeId,
      rating: dto.rating,
      comment: dto.comment,
      customerId: customer.id,
      bookingId: booking.id,
      customerName: customerName || customer.name,
    });

    if (!booking.metadata?.reviewSubmittedAt) {
      booking.metadata = {
        ...(booking.metadata || {}),
        reviewSubmittedAt: new Date().toISOString(),
        reviewSource: authenticatedCustomerId
          ? 'public_portal_session'
          : 'public_portal_google',
      };
      await this.bookingRepo.save(booking);
    }

    return this.toPublicProviderReview(review);
  }

  private async loadBookingForReview(
    slug: string,
    bookingId: string,
    token: string,
  ): Promise<Booking> {
    // e2e-bug.117 — reject non-UUID bookingId before Postgres uuid 500.
    assertUuid(bookingId, 'bookingId');

    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId: business.id },
      relations: {
        employee: true,
        service: true,
        customer: true,
        business: true,
      },
    });
    if (!booking) throw new NotFoundException('Appointment not found');

    // e2e-bug.118 — validate token before status so a guessed bookingId + wrong
    // token cannot learn whether the appointment is completed (same ordering as
    // guest manage-link auth).
    const expected = booking.metadata?.reviewToken;
    if (!expected || expected !== token) {
      throw new BadRequestException('Invalid or expired review link');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Reviews are available after your appointment is completed',
      );
    }

    return booking;
  }
}
