import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { MultiServiceBookingsService } from './multi-service-bookings.service.js';
import { UpdateMultiServiceSettingsDto } from './dto/update-multi-service-settings.dto.js';

@Controller('businesses/:businessId/multi-service')
@UseGuards(JwtAuthGuard)
export class MultiServiceBookingsController {
  constructor(
    private multiServiceBookingsService: MultiServiceBookingsService,
  ) {}

  @Get('settings')
  getSettings(@Param('businessId') businessId: string) {
    return this.multiServiceBookingsService.getSettings(businessId);
  }

  @Put('settings')
  updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateMultiServiceSettingsDto,
  ) {
    return this.multiServiceBookingsService.updateSettings(businessId, dto);
  }
}
