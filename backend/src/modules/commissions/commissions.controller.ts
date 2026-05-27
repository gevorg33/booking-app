import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
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
  async list(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.commissionsService.list(businessId);
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.commissionsService.create(businessId, dto as any);
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
