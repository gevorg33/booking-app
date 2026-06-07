import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { ClinicTestResultsService } from './clinic-test-results.service.js';
import { ClinicTestOrderService } from './order/clinic-test-order.service.js';
import { ClinicTestOrderBookingRequestService } from './order/clinic-test-order-booking-request.service.js';
import {
  BookClinicLabCollectionDto,
  CreateClinicCatalogOrderDto,
  PushClinicLabBookingRequestDto,
} from './order/dto/clinic-lab-booking-request.dto.js';
import { ClinicSpecimenService } from './specimen/clinic-specimen.service.js';
import { ClinicSpecimenStatusService } from './specimen/clinic-specimen-status.service.js';
import { TransitionClinicSpecimenDto } from './specimen/dto/clinic-specimen.dto.js';
import { ClinicTestResultService } from './test-result/clinic-test-result.service.js';
import { ClinicTestResultStatusService } from './test-result/clinic-test-result-status.service.js';
import { ClinicTestResultActionService } from './test-result/clinic-test-result-action.service.js';
import { TransitionClinicTestResultDto } from './test-result/dto/clinic-test-result.dto.js';
import { ClinicLabAccessService } from './shared/clinic-lab-access.service.js';
import { ClinicLabChangeHistoryService } from './shared/clinic-lab-change-history.service.js';
import {
  isClinicSpecimenStatus,
  isClinicTestResultStatus,
  type ClinicSpecimenStatus,
  type ClinicTestResultStatus,
} from '../../common/utils/clinic-lab-state.util.js';
import { isLegacyPatientTestResultViewId } from '../../common/utils/clinic-legacy-patient-test-results-bridge.util.js';

@Controller('businesses/:businessId/clinic-test-results')
@UseGuards(JwtAuthGuard)
export class ClinicTestResultsController {
  constructor(
    private readonly clinicTestResultsService: ClinicTestResultsService,
    private readonly clinicTestOrderService: ClinicTestOrderService,
    private readonly clinicTestOrderBookingRequestService: ClinicTestOrderBookingRequestService,
    private readonly clinicSpecimenService: ClinicSpecimenService,
    private readonly clinicSpecimenStatusService: ClinicSpecimenStatusService,
    private readonly clinicTestResultService: ClinicTestResultService,
    private readonly clinicTestResultActionService: ClinicTestResultActionService,
    private readonly clinicTestResultStatusService: ClinicTestResultStatusService,
    private readonly businessService: BusinessService,
    private readonly clinicLabAccessService: ClinicLabAccessService,
    private readonly clinicLabChangeHistoryService: ClinicLabChangeHistoryService,
  ) {}

  @Get('module-status')
  async getModuleStatus(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.clinicTestResultsService.getModuleStatus(businessId);
  }

  @Get('bookings/:bookingId/summaries')
  async listBookingSummaries(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.clinicLabAccessService.assertBookingLabAccess(
      businessId,
      user.id,
      bookingId,
    );
    const summaries =
      await this.clinicTestResultsService.listBookingLabSummaries(
        businessId,
        bookingId,
      );
    return { data: summaries };
  }

  @Get('bookings/:bookingId/orders')
  async listBookingOrders(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.clinicLabAccessService.assertBookingLabAccess(
      businessId,
      user.id,
      bookingId,
    );
    return {
      data: await this.clinicTestOrderService.listOrdersForBooking(
        businessId,
        bookingId,
      ),
    };
  }

  @Post('bookings/:bookingId/orders')
  async createBookingOrder(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Body() body: CreateClinicCatalogOrderDto | undefined,
  ) {
    await this.clinicLabAccessService.assertCanCreateManualLabOrder(
      businessId,
      user.id,
      bookingId,
    );
    if (body?.items?.length) {
      return {
        data: await this.clinicTestOrderService.createCatalogOrderForBooking(
          businessId,
          bookingId,
          body.items,
        ),
      };
    }
    return {
      data: await this.clinicTestOrderService.createManualOrderForBooking(
        businessId,
        bookingId,
      ),
    };
  }

  @Get('orders/:orderId/booking-actions')
  async getOrderBookingActions(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: string },
  ) {
    const order = await this.clinicLabAccessService.assertOrderLabAccess(
      businessId,
      user.id,
      orderId,
    );
    void order;
    return {
      data: await this.clinicTestOrderBookingRequestService.getOrderBookingActions(
        businessId,
        orderId,
      ),
    };
  }

  @Post('orders/:orderId/book-collection')
  async bookCollectionForOrder(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Body() dto: BookClinicLabCollectionDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.clinicLabAccessService.assertOrderLabAccess(
      businessId,
      user.id,
      orderId,
    );
    return {
      data: await this.clinicTestOrderBookingRequestService.bookCollectionForOrder(
        businessId,
        orderId,
        dto.collectionServiceId,
        dto.employeeId,
        dto.startTime,
        access.ctx.employeeId,
        user.id,
      ),
    };
  }

  @Post('orders/:orderId/push-to-patient')
  async pushOrderBookingRequestToPatient(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Body() dto: PushClinicLabBookingRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.clinicLabAccessService.assertOrderLabAccess(
      businessId,
      user.id,
      orderId,
    );
    return {
      data: await this.clinicTestOrderBookingRequestService.pushBookingRequestToPatient(
        businessId,
        orderId,
        dto.collectionServiceId,
        access.ctx.employeeId,
      ),
    };
  }

  @Get('orders')
  async listLabQueue(
    @Param('businessId') businessId: string,
    @Query('status') status: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('department') department: string | undefined,
    @Query('awaitingPatientBooking') awaitingPatientBooking: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    const scopedFilters =
      await this.clinicLabAccessService.scopeLabQueueFilters(
        businessId,
        user.id,
        {
          status,
          from,
          to,
          department,
          awaitingPatientBooking: awaitingPatientBooking === 'true',
        },
      );
    return {
      data: await this.clinicTestOrderService.listLabQueue(
        businessId,
        scopedFilters,
      ),
    };
  }

  @Get('specimens')
  async listSpecimens(
    @Param('businessId') businessId: string,
    @Query('view') view: 'collection' | 'tracking' | undefined,
    @Query('status') status: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('department') department: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    const scopedFilters =
      await this.clinicLabAccessService.scopeSpecimenListFilters(
        businessId,
        user.id,
        { view, status, from, to, department },
      );
    return {
      data: await this.clinicSpecimenService.listSpecimens(
        businessId,
        scopedFilters,
      ),
    };
  }

  @Get('specimens/:specimenId/label')
  async getSpecimenLabel(
    @Param('businessId') businessId: string,
    @Param('specimenId') specimenId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.clinicLabAccessService.assertSpecimenLabAccess(
      businessId,
      user.id,
      specimenId,
    );
    return {
      data: await this.clinicSpecimenService.getSpecimenLabel(
        businessId,
        specimenId,
      ),
    };
  }

  @Post('specimens/:specimenId/transition')
  async transitionSpecimen(
    @Param('businessId') businessId: string,
    @Param('specimenId') specimenId: string,
    @Body() dto: TransitionClinicSpecimenDto,
    @CurrentUser() user: { id: string },
  ) {
    if (!isClinicSpecimenStatus(dto.toStatus)) {
      throw new BadRequestException('Invalid clinic specimen status');
    }
    const access = await this.clinicLabAccessService.assertSpecimenLabAccess(
      businessId,
      user.id,
      specimenId,
    );
    return {
      data: await this.clinicSpecimenStatusService.transitionSpecimenStatus({
        businessId,
        specimenId,
        toStatus: dto.toStatus,
        employeeId: access.employeeId,
        note: dto.note,
        v1ShortPath: dto.v1ShortPath ?? true,
      }),
    };
  }

  @Get('bookings/:bookingId/results')
  async listBookingResults(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access =
      await this.clinicLabAccessService.assertBookingLabAccessContext(
        businessId,
        user.id,
        bookingId,
      );
    return {
      data: await this.clinicTestResultService.listResultsForBooking(
        businessId,
        bookingId,
        {
          ctx: access.ctx,
          bookingAccess: access.bookingAccess,
          bookingMetadata: access.bookingMetadata,
          customerId: access.customerId,
        },
      ),
    };
  }

  @Get('results/:resultId')
  async getResultDetail(
    @Param('businessId') businessId: string,
    @Param('resultId') resultId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.clinicLabAccessService.resolveResultDetailAccess(
      businessId,
      user.id,
      resultId,
    );
    return {
      data: await this.clinicTestResultService.getResultDetail(
        businessId,
        resultId,
        {
          ctx: access.ctx,
          bookingAccess: access.bookingAccess,
          bookingMetadata: access.bookingMetadata,
          customerId: access.customerId,
        },
      ),
    };
  }

  @Get('results')
  async listResults(
    @Param('businessId') businessId: string,
    @Query('view') view: 'entry' | 'review' | 'release' | undefined,
    @Query('status') status: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('department') department: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    const scopedFilters =
      await this.clinicLabAccessService.scopeResultListFilters(
        businessId,
        user.id,
        { view, status, from, to, department },
      );
    return {
      data: await this.clinicTestResultService.listResultQueue(
        businessId,
        scopedFilters,
      ),
    };
  }

  @Post('results/:resultId/transition')
  async transitionResult(
    @Param('businessId') businessId: string,
    @Param('resultId') resultId: string,
    @Body() dto: TransitionClinicTestResultDto,
    @CurrentUser() user: { id: string },
  ) {
    if (!isClinicTestResultStatus(dto.toStatus)) {
      throw new BadRequestException('Invalid clinic test result status');
    }
    if (isLegacyPatientTestResultViewId(resultId)) {
      throw new BadRequestException(
        'Legacy booking metadata results cannot be transitioned',
      );
    }
    const access = await this.clinicLabAccessService.assertResultLabAccess(
      businessId,
      user.id,
      resultId,
    );
    const staff = {
      userId: access.ctx.userId,
      role: String(access.ctx.membershipRole),
      employeeId: access.ctx.employeeId,
    };
    const transitionInput = {
      businessId,
      resultId,
      employeeId: access.ctx.employeeId,
      note: dto.note,
      staff,
    };
    const data =
      dto.toStatus === 'Released'
        ? await this.clinicTestResultActionService.markAsReleased({
            ...transitionInput,
            comment: dto.note,
          })
        : dto.toStatus === 'Reviewed'
          ? await this.clinicTestResultActionService.markAsReviewed({
              ...transitionInput,
              comment: dto.note,
            })
          : await this.clinicTestResultStatusService.transitionResultStatus({
              ...transitionInput,
              toStatus: dto.toStatus,
            });
    return { data };
  }

  @Get('orders/:orderId/change-history')
  async listOrderChangeHistory(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.clinicLabAccessService.assertOrderLabAccess(
      businessId,
      user.id,
      orderId,
    );
    return {
      data: await this.clinicLabChangeHistoryService.listOrderChangeHistory(
        businessId,
        orderId,
        access.ctx,
        access.bookingAccess,
      ),
    };
  }

  @Get('results/:resultId/change-history')
  async listResultChangeHistory(
    @Param('businessId') businessId: string,
    @Param('resultId') resultId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.clinicLabAccessService.assertResultLabAccess(
      businessId,
      user.id,
      resultId,
    );
    return {
      data: await this.clinicLabChangeHistoryService.listResultChangeHistory(
        businessId,
        resultId,
        access.ctx,
        access.bookingAccess,
      ),
    };
  }

  @Get('bookings/:bookingId/change-history')
  async listBookingChangeHistory(
    @Param('businessId') businessId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access =
      await this.clinicLabAccessService.assertBookingLabChangeHistoryAccess(
        businessId,
        user.id,
        bookingId,
      );
    return {
      data: await this.clinicLabChangeHistoryService.listBookingLabChangeHistory(
        businessId,
        bookingId,
        access.ctx,
        access.bookingAccess!,
      ),
    };
  }
}
