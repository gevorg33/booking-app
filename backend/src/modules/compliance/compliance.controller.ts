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
import { BusinessService } from '../business/business.service.js';
import { buildComplianceStatusSummary } from '../../common/utils/business-compliance.util.js';
import { ComplianceBreachService } from './compliance-breach.service.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import { ReportDataBreachDto } from './dto/report-data-breach.dto.js';

@Controller('businesses/:businessId/compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(
    private readonly breachService: ComplianceBreachService,
    private readonly phiAccessAudit: PhiAccessAuditService,
    private readonly businessService: BusinessService,
  ) {}

  @Get('status')
  async getComplianceStatus(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const business = await this.businessService.findOne(businessId);
    return buildComplianceStatusSummary(
      business.settings,
      business.settings?.businessType as string | undefined,
    );
  }

  @Post('breach-incidents')
  reportBreach(
    @Param('businessId') businessId: string,
    @Body() dto: ReportDataBreachDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.breachService.reportBreach(businessId, user.id, dto);
  }

  @Get('breach-incidents')
  listBreaches(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.breachService.listIncidents(businessId, user.id);
  }

  @Get('phi-access-audit')
  async listPhiAccessAudit(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    await this.businessService.ensureOwner(businessId, user.id);
    return this.phiAccessAudit.listForOwner(businessId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Post('phi-access-audit/purge-expired')
  async purgeExpiredPhiAudit(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureOwner(businessId, user.id);
    const purged = await this.phiAccessAudit.purgeExpired(businessId);
    return { purged };
  }
}
