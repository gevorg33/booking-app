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
  BadRequestException,
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
  UpdateProviderProfileDto,
  CreateProviderCustomerStaffNoteDto,
  CreateProviderSelfBlockDto,
  CreateProviderTimeOffRequestDto,
  ProviderMyStatsQueryDto,
  ProviderReviewsInboxQueryDto,
  ProviderRunningLateDto,
  ReassignProviderBookingDto,
} from './dto/provider-mobile.dto.js';
import {
  ProviderAiCommandDto,
  ProviderAiConfirmDto,
} from './dto/provider-ai-command.dto.js';
import { AiGatewayService } from '../ai/ai-gateway.service.js';
import { GuideTelemetryService } from '../ai/guide-telemetry.service.js';
import { IngestGuideTelemetryDto } from '../ai/dto/ingest-guide-telemetry.dto.js';
import { ProviderAiCommandService } from './provider-ai-command.service.js';
import { ProviderAiSuggestionsService } from './provider-ai-suggestions.service.js';
import { ProviderPushActionService } from './provider-push-action.service.js';
import { ProviderPushHistoryService } from './provider-push-history.service.js';
import { CompleteClinicTaskDto } from '../clinic-tasks/dto/clinic-task.dto.js';
import { SetBookingRetailSalesDto } from '../retail-pos/dto/set-booking-retail-sales.dto.js';

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
    private pushHistory: ProviderPushHistoryService,
    private guideTelemetry: GuideTelemetryService,
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
      assistantMode: dto.assistantMode,
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

  @Post('ai/guide-telemetry')
  ingestGuideTelemetry(
    @Param('businessId') businessId: string,
    @Body() dto: IngestGuideTelemetryDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.guideTelemetry.ingestClientEvents(
      businessId,
      dto.events,
      user.id,
    );
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

  @Get('floor/today')
  getTeamFloorToday(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('employeeId') employeeId?: string,
  ) {
    return this.providerService.getTeamFloorToday(
      businessId,
      user.id,
      employeeId,
    );
  }

  @Get('floor/whos-next')
  getTeamWhosNext(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getTeamWhosNext(businessId, user.id);
  }

  @Get('bookings/by-date')
  getBookingsByDate(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('date') date: string,
  ) {
    return this.providerService.getBookingsByDate(businessId, user.id, date);
  }

  @Get('calendar/month')
  getCalendarMonthSummary(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('month') month?: string,
  ) {
    return this.providerService.getCalendarMonthSummary(
      businessId,
      user.id,
      month,
    );
  }

  @Get('profile')
  getProfile(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getProviderProfile(businessId, user.id);
  }

  @Put('profile')
  updateProfile(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.providerService.updateProviderProfile(businessId, user.id, dto);
  }

  @Get('reviews')
  getReviews(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getProviderReviews(businessId, user.id);
  }

  @Get('reviews/inbox')
  getReviewsInbox(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ProviderReviewsInboxQueryDto,
  ) {
    return this.providerService.getProviderReviewsInbox(
      businessId,
      user.id,
      query,
    );
  }

  @Post('bookings/:bookingId/check-in')
  checkInBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.checkInBooking(businessId, user.id, bookingId);
  }

  @Post('bookings/:bookingId/running-late')
  markRunningLate(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ProviderRunningLateDto,
  ) {
    return this.providerService.markBookingRunningLate(
      businessId,
      user.id,
      bookingId,
      dto.minutesLate,
    );
  }

  @Post('bookings/:bookingId/ready-now')
  markReadyNow(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.markBookingReadyNow(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Get('bookings/:bookingId/reassign/options')
  getBookingReassignOptions(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getBookingReassignOptions(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Post('bookings/:bookingId/reassign')
  reassignBooking(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReassignProviderBookingDto,
  ) {
    return this.providerService.reassignBooking(
      businessId,
      user.id,
      bookingId,
      dto,
    );
  }

  @Post('bookings/:bookingId/request-review')
  requestBookingReview(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.requestBookingReview(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Get('stats')
  getMyStats(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ProviderMyStatsQueryDto,
  ) {
    return this.providerService.getMyStats(businessId, user.id, query);
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

  @Get('bookings/:bookingId/customer-context')
  getBookingCustomerContext(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getBookingCustomerContext(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Get('bookings/:bookingId/pre-visit-intake-summary')
  getBookingPreVisitIntakeSummary(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getBookingPreVisitIntakeSummary(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Get('bookings/:bookingId/customer-staff-notes')
  listBookingCustomerStaffNotes(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.listBookingCustomerStaffNotes(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Post('bookings/:bookingId/customer-staff-notes')
  createBookingCustomerStaffNote(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProviderCustomerStaffNoteDto,
  ) {
    return this.providerService.createBookingCustomerStaffNote(
      businessId,
      user.id,
      bookingId,
      dto,
    );
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

  @Get('retail-pos/products')
  listRetailProducts(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.listProviderRetailProducts(businessId, user.id);
  }

  @Get('bookings/:bookingId/retail-sales')
  getBookingRetailSales(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.getProviderBookingRetailSales(
      businessId,
      user.id,
      bookingId,
    );
  }

  @Put('bookings/:bookingId/retail-sales')
  setBookingRetailSales(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SetBookingRetailSalesDto,
  ) {
    return this.providerService.setProviderBookingRetailSales(
      businessId,
      user.id,
      bookingId,
      dto,
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

  @Post('schedule/blocks')
  createScheduleBlock(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProviderSelfBlockDto,
  ) {
    return this.providerService.createProviderSelfBlock(businessId, user.id, dto);
  }

  @Get('schedule/gaps')
  listScheduleGaps(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('date') date?: string,
  ) {
    if (!date) {
      throw new BadRequestException('date query parameter is required');
    }
    return this.providerService.listScheduleGaps(businessId, user.id, date);
  }

  @Post('time-off/requests')
  createTimeOffRequest(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateProviderTimeOffRequestDto,
  ) {
    return this.providerService.createProviderTimeOffRequest(
      businessId,
      user.id,
      dto,
    );
  }

  @Get('time-off/requests')
  listTimeOffRequests(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.listProviderTimeOffRequests(
      businessId,
      user.id,
    );
  }

  @Post('time-off/requests/:requestId/cancel')
  cancelTimeOffRequest(
    @Param('businessId') businessId: string,
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.providerService.cancelProviderTimeOffRequest(
      businessId,
      user.id,
      requestId,
    );
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

  @Get('push/notifications')
  listPushNotifications(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.pushHistory.listNotificationCenter(businessId, user.id);
  }

  @Post('push/notifications/read-all')
  markAllPushNotificationsRead(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.pushHistory.markAllNotificationsRead(businessId, user.id);
  }

  @Post('push/notifications/mark-booking-read')
  markBookingPushNotificationRead(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { bookingId?: string },
  ) {
    if (!body.bookingId?.trim()) {
      throw new BadRequestException('bookingId is required');
    }
    return this.pushHistory
      .markLatestBookingNotificationRead(
        businessId,
        user.id,
        body.bookingId.trim(),
      )
      .then(() => ({ success: true }));
  }

  @Post('push/notifications/:notificationId/read')
  markPushNotificationRead(
    @Param('businessId') businessId: string,
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.pushHistory.markNotificationRead(
      businessId,
      user.id,
      notificationId,
    );
  }
}
