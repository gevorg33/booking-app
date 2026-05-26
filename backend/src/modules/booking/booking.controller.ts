import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { BookingService } from './booking.service.js';
import { CreateBookingDto, UpdateBookingDto, GetAvailabilityDto, CancelBookingDto } from './dto/create-booking.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/bookings')
export class BookingController {
  constructor(
    private bookingService: BookingService,
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
  ) {
    return this.bookingService.findAll(businessId, date, employeeId);
  }

  @Get('upcoming')
  getUpcoming(@Param('businessId') businessId: string) {
    return this.bookingService.getUpcoming(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(id);
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.cancel(id, dto.reason, user?.id);
  }
}
