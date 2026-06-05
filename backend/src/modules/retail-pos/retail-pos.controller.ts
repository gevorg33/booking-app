import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { RetailPosService } from './retail-pos.service.js';
import { SetBookingRetailSalesDto } from './dto/set-booking-retail-sales.dto.js';

@Controller('businesses/:businessId')
@UseGuards(JwtAuthGuard)
export class RetailPosController {
  constructor(
    private retailPosService: RetailPosService,
    private businessService: BusinessService,
  ) {}

  @Get('retail-pos/products')
  async listProducts(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return {
      products: await this.retailPosService.listSellableProducts(businessId),
    };
  }

  @Get('bookings/:bookingId/retail-sales')
  async getBookingSales(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.retailPosService.getBookingRetailSales(businessId, bookingId);
  }

  @Put('bookings/:bookingId/retail-sales')
  async setBookingSales(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: SetBookingRetailSalesDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.retailPosService.setBookingRetailSales(
      businessId,
      bookingId,
      user.id,
      dto,
    );
  }
}
