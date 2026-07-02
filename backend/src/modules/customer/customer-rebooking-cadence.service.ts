import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Customer } from './entities/customer.entity.js';
import {
  learnCustomerServiceCadenceDaysFromCompletedBookings,
  mergeLearnedCadenceByServiceMetadata,
} from '../../common/utils/customer-rebooking-cadence.util.js';

/** adopt-6.5 — persist per-customer, per-service rebooking cadence after visits. */
@Injectable()
export class CustomerRebookingCadenceService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  async computeLearnedCadenceDays(
    businessId: string,
    customerId: string,
    serviceId: string,
  ): Promise<number | null> {
    const completed = await this.bookingRepo.find({
      where: {
        businessId,
        customerId,
        serviceId,
        status: BookingStatus.COMPLETED,
      },
      order: { endTime: 'DESC' },
      take: 6,
      select: { endTime: true },
    });
    return learnCustomerServiceCadenceDaysFromCompletedBookings(completed);
  }

  async persistLearnedCadenceForCompletedBooking(
    bookingId: string,
  ): Promise<void> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      select: {
        id: true,
        businessId: true,
        customerId: true,
        serviceId: true,
        status: true,
      },
    });
    if (!booking || booking.status !== BookingStatus.COMPLETED) return;

    const learned = await this.computeLearnedCadenceDays(
      booking.businessId,
      booking.customerId,
      booking.serviceId,
    );
    if (learned == null) return;

    const customer = await this.customerRepo.findOne({
      where: { id: booking.customerId },
    });
    if (!customer) return;

    customer.metadata = mergeLearnedCadenceByServiceMetadata(
      customer.metadata as Record<string, unknown> | null | undefined,
      booking.serviceId,
      learned,
    );
    await this.customerRepo.save(customer);
  }
}
