import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Review } from './entities/review.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { SubmitPublicReviewDto } from './dto/submit-public-review.dto.js';

export interface PublicReviewContext {
  businessName: string;
  employeeName: string;
  serviceName: string;
  customerName: string;
  appointmentDate: string;
  alreadySubmitted: boolean;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
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

  async summary(businessId: string) {
    const rows = await this.reviewRepo
      .createQueryBuilder('r')
      .select('r.employee_id', 'employeeId')
      .addSelect('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'count')
      .where('r.business_id = :businessId', { businessId })
      .groupBy('r.employee_id')
      .getRawMany<{ employeeId: string; avgRating: string; count: string }>();

    const employees = await this.employeeRepo.find({ where: { businessId, isActive: true } });
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
      if (existing) throw new ConflictException('A review was already submitted for this appointment');
    }

    return this.reviewRepo.save(
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
  }

  async ensureReviewToken(bookingId: string): Promise<string> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
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
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    const params = new URLSearchParams({ bookingId, token });
    return `${base}/book/${slug}/review?${params.toString()}`;
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

    return {
      businessName: booking.business.name,
      employeeName: booking.employee?.name ?? 'Provider',
      serviceName: booking.service?.name ?? 'Appointment',
      customerName: booking.customer?.name ?? 'Guest',
      appointmentDate: booking.startTime.toISOString(),
      alreadySubmitted: Boolean(existing || booking.metadata?.reviewSubmittedAt),
    };
  }

  async submitPublic(slug: string, dto: SubmitPublicReviewDto): Promise<Review> {
    const booking = await this.loadBookingForReview(slug, dto.bookingId, dto.token);

    if (booking.metadata?.reviewSubmittedAt) {
      throw new ConflictException('A review was already submitted for this appointment');
    }

    const existing = await this.reviewRepo.findOne({
      where: { businessId: booking.businessId, bookingId: booking.id },
    });
    if (existing) throw new ConflictException('A review was already submitted for this appointment');

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

  private async loadBookingForReview(slug: string, bookingId: string, token: string): Promise<Booking> {
    const business = await this.businessRepo.findOne({ where: { slug } });
    if (!business) throw new NotFoundException('Business not found');

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId: business.id },
      relations: { employee: true, service: true, customer: true, business: true },
    });
    if (!booking) throw new NotFoundException('Appointment not found');

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Reviews are available after your appointment is completed');
    }

    const expected = booking.metadata?.reviewToken;
    if (!expected || expected !== token) {
      throw new BadRequestException('Invalid or expired review link');
    }

    return booking;
  }
}
