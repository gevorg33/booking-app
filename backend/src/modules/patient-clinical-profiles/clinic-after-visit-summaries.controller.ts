import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  UpdateClinicAfterVisitSummaryReleaseDto,
  UpsertClinicAfterVisitSummaryDto,
} from './dto/clinic-after-visit-summary.dto.js';
import { ClinicAfterVisitSummariesService } from './clinic-after-visit-summaries.service.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';

@Controller(
  'businesses/:businessId/customers/:customerId/after-visit-summaries',
)
@UseGuards(JwtAuthGuard)
export class ClinicAfterVisitSummariesController {
  constructor(
    private readonly summariesService: ClinicAfterVisitSummariesService,
    private readonly accessService: PatientClinicalProfileAccessService,
  ) {}

  @Get('by-booking/:bookingId')
  async getByBooking(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.summariesService.getSummaryByBooking(
        businessId,
        customerId,
        bookingId,
        access,
      ),
    };
  }

  @Put('by-booking/:bookingId')
  async upsertByBooking(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpsertClinicAfterVisitSummaryDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.summariesService.upsertSummaryForBooking(
        businessId,
        customerId,
        bookingId,
        access,
        dto,
      ),
    };
  }

  @Patch('by-booking/:bookingId/release')
  async updateReleaseByBooking(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateClinicAfterVisitSummaryReleaseDto,
    @CurrentUser() user: { id: string },
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    return {
      data: await this.summariesService.updateSummaryReleaseForBooking(
        businessId,
        customerId,
        bookingId,
        access,
        dto,
      ),
    };
  }

  @Get('by-booking/:bookingId/export.pdf')
  async exportPdf(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    const access = await this.accessService.assertCustomerClinicalProfileAccess(
      businessId,
      user.id,
      customerId,
    );
    const html = await this.summariesService.exportPdfHtmlForBooking(
      businessId,
      customerId,
      bookingId,
      access,
    );
    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="after-visit-summary.html"',
    );
    res.send(html);
  }
}
