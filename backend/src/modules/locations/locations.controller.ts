import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(
    private locationsService: LocationsService,
    private businessService: BusinessService,
  ) {}

  @Get()
  async list(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.locationsService.findAll(businessId);
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: { name: string; address?: string; phone?: string; timezone?: string; isDefault?: boolean },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.locationsService.create(businessId, dto);
  }

  @Put(':id')
  async update(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.locationsService.update(id, businessId, dto as any);
  }

  @Delete(':id')
  async remove(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    await this.locationsService.remove(id, businessId);
    return { ok: true };
  }
}
