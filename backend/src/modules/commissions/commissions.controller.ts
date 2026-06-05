import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CommissionsService } from './commissions.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/commissions')
@UseGuards(JwtAuthGuard)
export class CommissionsController {
  constructor(
    private commissionsService: CommissionsService,
    private businessService: BusinessService,
  ) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.commissionsService.list(businessId);
  }

  @Get('payout-export')
  async exportPayout(
    @Param('businessId') businessId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('locationId') locationId: string | undefined,
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const result = await this.commissionsService.exportPayoutCsv(
      businessId,
      from,
      to,
      locationId,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    return result.content;
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.commissionsService.create(businessId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    await this.commissionsService.remove(id, businessId);
    return { ok: true };
  }
}
