import { Controller, Get, Query, Param, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service.js';
import { AppEventService } from './app-event.service.js';
import { AnalyticsQueryDto } from './dto/analytics-query.dto.js';
import { AdoptionMetricsQueryDto } from './dto/adoption-metrics-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private appEventService: AppEventService,
    private businessService: BusinessService,
  ) {}

  /** adopt-1.7 — adoption funnel, cohorts, activation dashboard */
  @Get('adoption')
  async adoption(
    @Param('businessId') businessId: string,
    @Query() query: AdoptionMetricsQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.appEventService.getAdoptionDashboard(businessId, query.days ?? 30);
  }

  @Get('staff')
  async staff(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.analyticsService.staffPerformance(businessId, query);
  }

  @Get('services')
  async services(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.analyticsService.servicePopularity(businessId, query);
  }

  @Get('heatmap')
  async heatmap(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.analyticsService.heatmap(businessId, query);
  }

  @Get('pl')
  async pl(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.analyticsService.profitAndLoss(businessId, query);
  }

  @Get('export.csv')
  async exportCsv(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const csv = await this.analyticsService.exportCsv(businessId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    res.send(csv);
  }

  @Get('export.pdf')
  async exportPdf(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const html = await this.analyticsService.exportPdfHtml(businessId, query);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'inline; filename="report.html"');
    res.send(html);
  }
}
