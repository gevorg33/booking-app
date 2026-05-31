import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { CreateBookingDto, UpdateBookingDto, GetAvailabilityDto, CancelBookingDto } from './dto/create-booking.dto.js';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { withBookingPaymentSummary } from './booking-payment-summary.util.js';
import { RetailPosService } from '../retail-pos/retail-pos.service.js';

@Controller('businesses/:businessId/bookings')
export class BookingController {
  constructor(
    private bookingService: BookingService,
    private retailPosService: RetailPosService,
  ) {}

  @Get('availability')
  getAvailability(@Param('businessId') businessId: string, @Query() dto: GetAvailabilityDto) {
    return this.bookingService.getAvailability(businessId, dto);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.create(businessId, dto, user?.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.update(id, dto, user?.id);
  }

  @Get()
  findAll(
    @Param('businessId') businessId: string,
    @Query('date') date?: string,
    @Query('employeeId') employeeId?: string,
    @Query('includeHidden') includeHidden?: string,
  ) {
    return this.bookingService.findAll(
      businessId,
      date,
      employeeId,
      includeHidden === 'true',
    );
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  searchDashboard(
    @Param('businessId') businessId: string,
    @Query() query: GetBookingsQueryDto,
  ) {
    return this.bookingService.searchDashboard(businessId, query);
  }

  @Get('upcoming')
  getUpcoming(@Param('businessId') businessId: string) {
    return this.bookingService.getUpcoming(businessId);
  }

  @Get(':id')
  async findOne(@Param('businessId') businessId: string, @Param('id') id: string) {
    const booking = await this.bookingService.findOne(id);
    const checkout = await this.retailPosService.getBookingRetailSales(businessId, id);
    const retailLines = checkout.lines.map((line) => ({
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }));
    return withBookingPaymentSummary(booking, retailLines);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.cancel(id, dto.reason, user?.id, dto.expectedUpdatedAt);
  }
}
