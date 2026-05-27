import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private businessService: BusinessService,
  ) {}

  @Get('products')
  async list(
    @Param('businessId') businessId: string,
    @Query('locationId') locationId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.listProducts(businessId, locationId);
  }

  @Post('products')
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.createProduct(businessId, dto as any);
  }

  @Post('products/:id/adjust')
  async adjust(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: { delta: number },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.adjustStock(id, businessId, dto.delta);
  }

  @Post('service-links')
  async link(
    @Param('businessId') businessId: string,
    @Body() dto: { serviceId: string; productId: string; quantityPerService?: number },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.linkToService(dto.serviceId, dto.productId, dto.quantityPerService);
  }
}
