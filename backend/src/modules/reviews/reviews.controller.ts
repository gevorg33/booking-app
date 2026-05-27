import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/reviews')
export class ReviewsController {
  constructor(
    private reviewsService: ReviewsService,
    private businessService: BusinessService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Param('businessId') businessId: string,
    @Query('employeeId') employeeId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.reviewsService.list(businessId, employeeId);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async summary(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.reviewsService.summary(businessId);
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Body()
    dto: {
      employeeId: string;
      rating: number;
      comment?: string;
      customerId?: string;
      bookingId?: string;
      customerName?: string;
    },
  ) {
    return this.reviewsService.create(businessId, dto);
  }
}
