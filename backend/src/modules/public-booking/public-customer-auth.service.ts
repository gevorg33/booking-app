import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Review } from '../reviews/entities/review.entity.js';
import { FirebaseAdminService } from '../../common/firebase/firebase-admin.service.js';
import { BusinessService } from '../business/business.service.js';
import {
  PublicCustomerAuthResponse,
  PublicCustomerBookingItem,
  PublicCustomerJwtPayload,
  PublicCustomerProfile,
} from './public-customer-auth.types.js';

@Injectable()
export class PublicCustomerAuthService {
  constructor(
    private businessService: BusinessService,
    private jwtService: JwtService,
    private firebase: FirebaseAdminService,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  async loginWithGoogle(slug: string, idToken: string): Promise<PublicCustomerAuthResponse> {
    if (!this.firebase.isReady) {
      throw new BadRequestException('Google sign-in is not configured on the server');
    }

    let decoded;
    try {
      decoded = await this.firebase.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid Google sign-in token');
    }

    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    const business = await this.resolveBusiness(slug);
    const name =
      decoded.name?.trim() ||
      [decoded.given_name, decoded.family_name].filter(Boolean).join(' ').trim() ||
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
            authProvider: 'google',
            googleSub: decoded.uid,
            photoUrl: decoded.picture ?? null,
          },
        }),
      );
    } else {
      const metadata = { ...(customer.metadata || {}) };
      let dirty = false;
      if (name && customer.name !== name) {
        customer.name = name;
        dirty = true;
      }
      if (!metadata.googleSub) {
        metadata.googleSub = decoded.uid;
        metadata.authProvider = 'google';
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

    const token = this.signToken(customer, business.id, email);
    return { token, customer: this.toProfile(customer) };
  }

  getProfile(customer: Customer): PublicCustomerProfile {
    return this.toProfile(customer);
  }

  async getCustomerById(businessId: string, customerId: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) throw new UnauthorizedException('Customer session expired');
    return customer;
  }

  async listBookings(slug: string, customerId: string): Promise<{ bookings: PublicCustomerBookingItem[] }> {
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

    return {
      bookings: bookings.map((booking) => ({
        id: booking.id,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        serviceName: booking.service?.name ?? 'Service',
        employeeName: booking.employee?.name ?? 'Specialist',
        employeeId: booking.employeeId,
        canReview:
          booking.status === BookingStatus.COMPLETED && !reviewBookingIds.has(booking.id),
      })),
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
