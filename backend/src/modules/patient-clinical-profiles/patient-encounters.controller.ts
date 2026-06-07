import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreatePatientEncounterAddendumDto } from './dto/create-patient-encounter-addendum.dto.js';
import { UpsertPatientEncounterByBookingDto } from './dto/upsert-patient-encounter.dto.js';
import { PatientEncountersService } from './patient-encounters.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';

@Controller('businesses/:businessId/customers/:customerId/encounters')
@UseGuards(JwtAuthGuard)
export class PatientEncountersController {
  constructor(
    private readonly encountersService: PatientEncountersService,
    private readonly accessService: PatientClinicalProfileAccessService,
  ) {}

  @Get()
  async listEncounters(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.encountersService.listEncountersForCustomer(
        businessId,
        customerId,
        access,
      ),
    };
  }

  @Get(':encounterId')
  async getEncounter(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('encounterId') encounterId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.encountersService.getEncounterDetail(
        businessId,
        customerId,
        encounterId,
        access,
      ),
    };
  }

  @Put('by-booking/:bookingId')
  async upsertByBooking(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpsertPatientEncounterByBookingDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.encountersService.upsertEncounterForBooking(
        businessId,
        customerId,
        bookingId,
        access,
        dto,
      ),
    };
  }

  @Post(':encounterId/addenda')
  async appendAddendum(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('encounterId') encounterId: string,
    @Body() dto: CreatePatientEncounterAddendumDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.encountersService.appendAddendum(
        businessId,
        customerId,
        encounterId,
        access,
        dto,
      ),
    };
  }
}
