import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { ClinicPatientAlertType } from '../../common/utils/clinic-patient-alert.types.js';
import { PatientChartService } from './patient-chart.service.js';
import { PatientClinicalAlertsService } from './patient-clinical-alerts.service.js';

@Controller('businesses/:businessId/customers/:customerId/patient-chart')
@UseGuards(JwtAuthGuard)
export class PatientChartController {
  constructor(
    private readonly patientChartService: PatientChartService,
    private readonly patientClinicalAlertsService: PatientClinicalAlertsService,
  ) {}

  @Get('alerts')
  async listAlerts(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.patientClinicalAlertsService.listAlertsForCustomer(
        businessId,
        customerId,
        user.id,
      ),
    };
  }

  @Post('alerts/:alertType/:sourceId/dismiss')
  async dismissAlert(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('alertType') alertType: ClinicPatientAlertType,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.patientClinicalAlertsService.dismissAlert(
        businessId,
        customerId,
        user.id,
        alertType,
        sourceId,
      ),
    };
  }

  @Get('orders')
  async listOrders(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.patientChartService.listOrdersForCustomer(
        businessId,
        customerId,
        user.id,
      ),
    };
  }

  @Get('results')
  async listResults(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    return {
      data: await this.patientChartService.listResultsForCustomer(
        businessId,
        customerId,
        user.id,
      ),
    };
  }
}
