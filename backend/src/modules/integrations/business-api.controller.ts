import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import {
  ApiBusinessId,
  CurrentApiKey,
} from '../../common/decorators/api-key.decorator.js';
import { BookingService } from '../booking/booking.service.js';
import { CustomerService } from '../customer/customer.service.js';
import { ServiceService } from '../service/service.service.js';
import type { BusinessApiKey } from './entities/business-api-key.entity.js';

@Controller('v1')
@UseGuards(ApiKeyGuard)
export class BusinessApiController {
  constructor(
    private bookingService: BookingService,
    private customerService: CustomerService,
    private serviceService: ServiceService,
  ) {}

  @Get('bookings')
  listBookings(
    @ApiBusinessId() businessId: string,
    @CurrentApiKey() apiKey: BusinessApiKey,
    @Query('date') date?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    this.requireScope(apiKey, 'read:bookings');
    return this.bookingService.findAll(businessId, date, employeeId);
  }

  @Get('bookings/:id')
  getBooking(
    @ApiBusinessId() businessId: string,
    @CurrentApiKey() apiKey: BusinessApiKey,
    @Param('id') id: string,
  ) {
    this.requireScope(apiKey, 'read:bookings');
    return this.bookingService.findOne(id).then((booking) => {
      if (booking.businessId !== businessId) {
        throw new ForbiddenException('Booking not found');
      }
      return booking;
    });
  }

  @Get('customers')
  listCustomers(
    @ApiBusinessId() businessId: string,
    @CurrentApiKey() apiKey: BusinessApiKey,
  ) {
    this.requireScope(apiKey, 'read:customers');
    return this.customerService.findAll(businessId);
  }

  @Get('services')
  listServices(
    @ApiBusinessId() businessId: string,
    @CurrentApiKey() apiKey: BusinessApiKey,
  ) {
    this.requireScope(apiKey, 'read:services');
    return this.serviceService.findAll(businessId);
  }

  private requireScope(apiKey: BusinessApiKey, scope: string): void {
    if (!apiKey.scopes.includes(scope)) {
      throw new ForbiddenException(`API key missing scope: ${scope}`);
    }
  }
}
