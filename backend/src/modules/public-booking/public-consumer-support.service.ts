import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import type { PublicConsumerSupportTicketDto } from './dto/public-consumer-support-ticket.dto.js';

@Injectable()
export class PublicConsumerSupportService {
  constructor(
    private readonly businessService: BusinessService,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly zendeskIntegrationService: ZendeskIntegrationService,
  ) {}

  async createPostBookingSupportTicket(
    slug: string,
    customerId: string,
    dto: PublicConsumerSupportTicketDto,
  ) {
    const business = await this.businessService.findBySlug(slug);
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId: business.id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const booking = await this.bookingRepo.findOne({
      where: {
        id: dto.bookingId,
        businessId: business.id,
        customerId,
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!customer.email?.trim()) {
      throw new BadRequestException(
        'An email on your profile is required to open a support ticket',
      );
    }

    const message =
      dto.message?.trim() ||
      'Customer tapped "Could be better" on the post-booking satisfaction prompt in the mobile app.';

    return this.zendeskIntegrationService.createSupportTicket(
      business.id,
      {
        subject: `Post-booking app feedback — ${business.name}`,
        body: message,
        customerId: customer.id,
        bookingId: booking.id,
        requesterEmail: customer.email,
        requesterName: customer.name,
        tags: ['optischedule', 'consumer-app', 'post-booking-feedback'],
      },
    );
  }
}
