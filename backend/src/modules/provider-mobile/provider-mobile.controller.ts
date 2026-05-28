import {
  Controller,
  Get,
  Post,
  Put,
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
import { SubscribePushDto, RegisterNativePushDto, UpdateProviderBookingDto, CancelProviderBookingDto, SuggestCancelNoteDto } from './dto/provider-mobile.dto.js';
import { ProviderAiCommandDto, ProviderAiConfirmDto } from './dto/provider-ai-command.dto.js';
import { ProviderAiCommandService } from './provider-ai-command.service.js';

@Controller('businesses/:businessId/provider')
@UseGuards(JwtAuthGuard)
export class ProviderMobileController {
  constructor(
    private providerService: ProviderMobileService,
    private pushService: PushService,
    private providerAi: ProviderAiCommandService,
  ) {}

  @Get('context')
  getContext(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    return this.providerService.getContext(businessId, user.id);
  }

  @Post('ai/command')
  runAiCommand(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ProviderAiCommandDto,
  ) {
    return this.providerAi.executeCommand(
      businessId,
      user.id,
      dto.prompt,
      dto.history,
      dto.context,
    );
  }

  @Post('ai/command/confirm')
  confirmAiCommand(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ProviderAiConfirmDto,
  ) {
    return this.providerAi.confirmAction(businessId, user.id, dto);
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

  @Get('bookings/:bookingId')
  getBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getBookingDetail(businessId, user.id, bookingId);
  }

  @Put('bookings/:bookingId')
  updateBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProviderBookingDto,
  ) {
    return this.providerService.updateBooking(businessId, user.id, bookingId, dto);
  }

  @Put('bookings/:bookingId/cancel')
  cancelBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CancelProviderBookingDto,
  ) {
    return this.providerService.cancelBooking(businessId, user.id, bookingId, dto);
  }

  @Post('bookings/:bookingId/cancel/suggest-note')
  suggestCancelNote(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SuggestCancelNoteDto,
  ) {
    return this.providerService.suggestCancelNote(businessId, user.id, bookingId, dto);
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
