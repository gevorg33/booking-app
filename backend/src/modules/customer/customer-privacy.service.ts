import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import {
  CustomerPrivacyExport,
  buildGdprMetadata,
  getCustomerGdpr,
} from './customer-privacy.types.js';

@Injectable()
export class CustomerPrivacyService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  applyConsent(
    customer: Customer,
    consent: {
      privacyAccepted?: boolean;
      privacyVersion?: string;
      marketingOptIn?: boolean;
      source?: 'checkout' | 'account' | 'admin';
    },
  ): Customer {
    customer.metadata = buildGdprMetadata(customer.metadata, consent);
    return customer;
  }

  async exportCustomerData(
    businessId: string,
    customerId: string,
  ): Promise<CustomerPrivacyExport> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const bookings = await this.bookingRepo.find({
      where: { businessId, customerId },
      relations: { employee: true, service: true },
      order: { startTime: 'DESC' },
      take: 500,
    });

    const gdpr = getCustomerGdpr(customer.metadata);
    return {
      exportedAt: new Date().toISOString(),
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        tags: customer.tags ?? null,
        isVip: customer.isVip,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
      gdpr: Object.keys(gdpr).length ? gdpr : null,
      notifications:
        (customer.metadata?.notifications as Record<string, boolean>) ?? null,
      bookings: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        paymentStatus: b.paymentStatus,
        serviceName: b.service?.name ?? null,
        employeeName: b.employee?.name ?? null,
      })),
    };
  }

  async deleteCustomerData(
    businessId: string,
    customerId: string,
  ): Promise<{ deleted: true }> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    customer.name = 'Deleted customer';
    customer.email = undefined as unknown as string;
    customer.phone = undefined as unknown as string;
    customer.tags = [];
    customer.isVip = false;
    customer.isActive = false;
    customer.metadata = {
      ...(customer.metadata || {}),
      gdpr: {
        ...getCustomerGdpr(customer.metadata),
        deletedAt: new Date().toISOString(),
        deletionRequested: true,
      },
    };
    await this.customerRepo.save(customer);
    return { deleted: true };
  }
}
