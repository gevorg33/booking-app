import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ServicePackagesService,
  type PackageListFilter,
} from './service-packages.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/packages')
@UseGuards(JwtAuthGuard)
export class ServicePackagesController {
  constructor(
    private packagesService: ServicePackagesService,
    private businessService: BusinessService,
  ) {}

  @Get()
  async listPackages(
    @Param('businessId') businessId: string,
    @Query('filter') filter: PackageListFilter | undefined,
    @Query('includeInactive') includeInactive: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.listPackages(
      businessId,
      filter ?? 'all',
      includeInactive === 'true',
    );
  }

  @Get(':packageId')
  async getPackage(
    @Param('businessId') businessId: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.getPackage(businessId, packageId);
  }

  @Post()
  async createPackage(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.createPackage(businessId, dto as any);
  }

  @Put(':packageId')
  async updatePackage(
    @Param('businessId') businessId: string,
    @Param('packageId') packageId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.updatePackage(businessId, packageId, dto);
  }

  @Patch(':packageId/deactivate')
  async deactivatePackage(
    @Param('businessId') businessId: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.deactivatePackage(businessId, packageId);
  }

  @Patch(':packageId/activate')
  async activatePackage(
    @Param('businessId') businessId: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.activatePackage(businessId, packageId);
  }

  @Delete(':packageId')
  async deletePackage(
    @Param('businessId') businessId: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.deletePackage(businessId, packageId);
  }

  @Post(':packageId/duplicate')
  async duplicatePackage(
    @Param('businessId') businessId: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.duplicatePackage(businessId, packageId);
  }

  @Get(':packageId/preview')
  async previewPackage(
    @Param('businessId') businessId: string,
    @Param('packageId') packageId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.packagesService.previewPackagePricing(businessId, packageId);
  }
}
