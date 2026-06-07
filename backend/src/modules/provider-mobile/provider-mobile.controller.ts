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
import {
  SubscribePushDto,
  RegisterNativePushDto,
  UpdateProviderBookingDto,
  CancelProviderBookingDto,
  SuggestCancelNoteDto,
} from './dto/provider-mobile.dto.js';
import {
  ProviderAiCommandDto,
  ProviderAiConfirmDto,
} from './dto/provider-ai-command.dto.js';
import { AiGatewayService } from '../ai/ai-gateway.service.js';
import { ProviderAiCommandService } from './provider-ai-command.service.js';
import { ProviderAiSuggestionsService } from './provider-ai-suggestions.service.js';
import { ProviderPushActionService } from './provider-push-action.service.js';
import { CompleteClinicTaskDto } from '../clinic-tasks/dto/clinic-task.dto.js';

@Controller('businesses/:businessId/provider')
@UseGuards(JwtAuthGuard)
export class ProviderMobileController {
  constructor(
    private providerService: ProviderMobileService,
    private pushService: PushService,
    private aiGateway: AiGatewayService,
    private providerAi: ProviderAiCommandService,
    private providerAiSuggestions: ProviderAiSuggestionsService,
    private pushActions: ProviderPushActionService,
  ) {}

  @Get('context')
  getContext(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getContext(businessId, user.id);
  }

  @Get('ai/capabilities')
  getAiCapabilities(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string; membershipRole?: string },
  ) {
    return this.aiGateway.getCapabilities(
      businessId,
      'provider',
      user.membershipRole,
    );
  }

  @Post('ai/command')
  runAiCommand(
    @Param('businessId') businessId: string,
    @CurrentUser()
    user: { id: string; membershipRole?: string; employeeId?: string },
    @Body() dto: ProviderAiCommandDto,
  ) {
    return this.aiGateway.execute({
      surface: 'provider',
      businessId,
      prompt: dto.prompt,
      userId: user.id,
      membershipRole: user.membershipRole,
      employeeId: user.employeeId ?? null,
      history: dto.history,
      context: dto.context,
      confirmed: dto.context?.confirmed === true,
    });
  }

  @Post('ai/command/confirm')
  confirmAiCommand(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ProviderAiConfirmDto,
  ) {
    return this.providerAi.confirmAction(businessId, user.id, dto);
  }

  @Get('ai/suggestions')
  getAiSuggestions(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerAiSuggestions.getSuggestions(businessId, user.id);
  }

  @Get('bookings/today')
  getToday(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getTodayBookings(businessId, user.id);
  }

  @Get('lab-collection/today')
  getTodayLabCollection(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getTodayLabCollectionQueue(businessId, user.id);
  }

  @Get('lab-results')
  getAssignedLabResults(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getProviderLabResultsQueue(businessId, user.id);
  }

  @Get('clinic-tasks')
  getClinicTaskInbox(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getProviderClinicTaskInbox(businessId, user.id);
  }

  @Post('clinic-tasks/:taskId/claim')
  claimClinicTask(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.claimProviderClinicTask(
      businessId,
      user.id,
      taskId,
    );
  }

  @Post('clinic-tasks/:taskId/complete')
  completeClinicTask(
    @Param('businessId') businessId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CompleteClinicTaskDto,
  ) {
    return this.providerService.completeProviderClinicTask(
      businessId,
      user.id,
      taskId,
      dto,
    );
  }

  @Get('patients/search')
  searchPatients(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('q') query?: string,
  ) {
    return this.providerService.searchProviderPatients(
      businessId,
      user.id,
      query ?? '',
    );
  }

  @Get('patients/:customerId/chart-summary')
  getPatientChartSummary(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getProviderPatientChartSummary(
      businessId,
      user.id,
      customerId,
    );
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
    return this.providerService.getBookingDetail(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Put('bookings/:bookingId')
  updateBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProviderBookingDto,
  ) {
    return this.providerService.updateBooking(
      businessId,
      user.id,
      bookingId,
      dto,
    );
  }

  @Put('bookings/:bookingId/cancel')
  cancelBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CancelProviderBookingDto,
  ) {
    return this.providerService.cancelBooking(
      businessId,
      user.id,
      bookingId,
      dto,
    );
  }

  @Post('bookings/:bookingId/cancel/suggest-note')
  suggestCancelNote(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SuggestCancelNoteDto,
  ) {
    return this.providerService.suggestCancelNote(
      businessId,
      user.id,
      bookingId,
      dto,
    );
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
    return {
      publicKey: this.pushService.getPublicKey(),
      configured: this.pushService.isConfigured,
    };
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

  @Post('push/action')
  handlePushAction(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      actionId: 'confirm' | 'mark_paid' | 'suggest_reschedule';
      bookingId: string;
    },
  ) {
    return this.pushActions.handleAction(businessId, user.id, {
      actionId: body.actionId,
      bookingId: body.bookingId,
      businessId,
    });
  }
}
