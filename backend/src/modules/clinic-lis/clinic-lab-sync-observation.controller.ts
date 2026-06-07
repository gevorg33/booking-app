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
import { ClinicLabSyncObservationService } from './clinic-lab-sync-observation.service.js';
import {
  IngestClinicLabSyncObservationRequestDto,
  LinkClinicLabSyncObservationRequestDto,
  ListClinicLabSyncObservationRequestsQueryDto,
} from './dto/clinic-lis.dto.js';

@Controller('businesses/:businessId/clinic-lab-sync/observation-requests')
@UseGuards(JwtAuthGuard)
export class ClinicLabSyncObservationController {
  constructor(
    private readonly syncObservationService: ClinicLabSyncObservationService,
  ) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListClinicLabSyncObservationRequestsQueryDto,
  ) {
    return {
      data: await this.syncObservationService.listObservationRequests(
        businessId,
        user.id,
        query,
      ),
    };
  }

  @Post()
  async ingest(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: IngestClinicLabSyncObservationRequestDto,
  ) {
    return {
      data: await this.syncObservationService.ingestObservationRequest(
        businessId,
        user.id,
        dto,
      ),
    };
  }

  @Post(':observationRequestId/link')
  async link(
    @Param('businessId') businessId: string,
    @Param('observationRequestId') observationRequestId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: LinkClinicLabSyncObservationRequestDto,
  ) {
    return {
      data: await this.syncObservationService.linkObservationRequestToResult(
        businessId,
        user.id,
        observationRequestId,
        dto,
      ),
    };
  }
}
