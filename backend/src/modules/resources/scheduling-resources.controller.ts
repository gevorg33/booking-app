import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SchedulingResourcesService } from './scheduling-resources.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/resources')
@UseGuards(JwtAuthGuard)
export class SchedulingResourcesController {
  constructor(
    private resourcesService: SchedulingResourcesService,
    private businessService: BusinessService,
  ) {}

  @Get()
  async list(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.resourcesService.listResources(businessId);
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: { name: string; resourceType?: string; locationId?: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.resourcesService.createResource(businessId, dto);
  }

  @Put(':resourceId')
  async update(
    @Param('businessId') businessId: string,
    @Param('resourceId') resourceId: string,
    @Body() dto: { name?: string; resourceType?: string; locationId?: string | null },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.resourcesService.updateResource(businessId, resourceId, dto);
  }

  @Delete(':resourceId')
  async deactivate(
    @Param('businessId') businessId: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.resourcesService.deactivateResource(businessId, resourceId);
  }

  @Get('services/:serviceId/requirements')
  async getRequirements(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.resourcesService.getServiceRequirements(businessId, serviceId);
  }

  @Put('services/:serviceId/requirements')
  async setRequirements(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: { resourceIds: string[] },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.resourcesService.setServiceRequirements(businessId, serviceId, dto.resourceIds ?? []);
  }
}
