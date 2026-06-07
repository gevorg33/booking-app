import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UpdatePatientClinicalProfileDto } from './dto/update-patient-clinical-profile.dto.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { PatientClinicalProfilesService } from './patient-clinical-profiles.service.js';

@Controller('businesses/:businessId/customers/:customerId/clinical-profile')
@UseGuards(JwtAuthGuard)
export class PatientClinicalProfilesController {
  constructor(
    private readonly profilesService: PatientClinicalProfilesService,
    private readonly accessService: PatientClinicalProfileAccessService,
  ) {}

  @Get()
  async getProfile(
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
      data: await this.profilesService.getProfileForCustomer(
        businessId,
        customerId,
        access,
      ),
    };
  }

  @Put()
  async upsertProfile(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: UpdatePatientClinicalProfileDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.profilesService.upsertProfileForCustomer(
        businessId,
        customerId,
        access,
        dto,
      ),
    };
  }
}
