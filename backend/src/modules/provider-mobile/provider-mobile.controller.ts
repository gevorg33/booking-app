import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import { PushService } from './push.service.js';
import { SubscribePushDto, RegisterNativePushDto } from './dto/provider-mobile.dto.js';

@Controller('businesses/:businessId/provider')
@UseGuards(JwtAuthGuard)
export class ProviderMobileController {
  constructor(
    private providerService: ProviderMobileService,
    private pushService: PushService,
  ) {}

  @Get('context')
  getContext(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    return this.providerService.getContext(businessId, user.id);
  }

  @Get('bookings/today')
  getToday(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    return this.providerService.getTodayBookings(businessId, user.id);
  }

  @Get('bookings/upcoming')
  getUpcoming(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('days') days?: string,
  ) {
    const n = days ? Math.min(30, Math.max(1, parseInt(days, 10) || 7)) : 7;
    return this.providerService.getUpcomingBookings(businessId, user.id, n);
  }

  @Get('schedule/summary')
  getScheduleSummary(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('days') days?: string,
  ) {
    const n = days ? Math.min(30, Math.max(1, parseInt(days, 10) || 14)) : 14;
    return this.providerService.getScheduleSummary(businessId, user.id, n);
  }

  @Get('push/vapid-public-key')
  getVapidKey() {
    return { publicKey: this.pushService.getPublicKey(), configured: this.pushService.isConfigured };
  }

  @Post('push/subscribe')
  subscribePush(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubscribePushDto,
    @Req() req: Request,
  ) {
    return this.pushService.subscribe(
      user.id,
      businessId,
      dto,
      req.headers['user-agent'],
    );
  }

  @Delete('push/subscribe')
  unsubscribePush(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { endpoint: string },
  ) {
    return this.pushService.unsubscribe(user.id, businessId, body.endpoint);
  }

  @Post('push/register-native')
  registerNativePush(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterNativePushDto,
  ) {
    return this.pushService.registerNativeToken(user.id, businessId, dto);
  }

  @Get('push/native-status')
  getNativePushStatus(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('platform') platform?: 'ios' | 'android',
  ) {
    return this.pushService.getNativePushStatus(user.id, businessId, platform);
  }
}
