import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ProviderTimeOffService } from './provider-time-off.service.js';
import { ReviewProviderTimeOffRequestDto } from './dto/provider-mobile.dto.js';

@Controller('businesses/:businessId/time-off-requests')
@UseGuards(JwtAuthGuard)
export class ProviderTimeOffDashboardController {
  constructor(private timeOffService: ProviderTimeOffService) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('status') status?: string,
  ) {
    await this.timeOffService.assertManagerAccess(businessId, user.id);
    const requests = await this.timeOffService.listForBusiness(
      businessId,
      status,
    );
    return { requests };
  }

  @Post(':requestId/approve')
  async approve(
    @Param('businessId') businessId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewProviderTimeOffRequestDto,
  ) {
    await this.timeOffService.assertManagerAccess(businessId, user.id);
    return this.timeOffService.approveRequest(
      businessId,
      user.id,
      requestId,
      dto.reviewNotes,
    );
  }

  @Post(':requestId/deny')
  async deny(
    @Param('businessId') businessId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewProviderTimeOffRequestDto,
  ) {
    await this.timeOffService.assertManagerAccess(businessId, user.id);
    return this.timeOffService.denyRequest(
      businessId,
      user.id,
      requestId,
      dto.reviewNotes,
    );
  }
}
