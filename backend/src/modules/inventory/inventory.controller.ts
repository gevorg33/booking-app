import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { ProductRecommendationService } from './product-recommendation.service.js';
import { LinkServiceProductDto } from './dto/link-service-product.dto.js';
import { SetRecommendedProductsDto } from './dto/set-recommended-products.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private productRecommendationService: ProductRecommendationService,
    private businessService: BusinessService,
  ) {}

  @Get('products')
  async list(
    @Param('businessId') businessId: string,
    @Query('locationId') locationId: string,
    @Query('includeInactive') includeInactive: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.listProducts(
      businessId,
      locationId,
      includeInactive === 'true',
    );
  }

  @Post('products')
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.createProduct(businessId, dto);
  }

  @Put('products/:id')
  async update(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.updateProduct(id, businessId, dto);
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

  @Get('service-links')
  async listLinks(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId: string,
    @Query('productId') productId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.listServiceLinks(businessId, {
      serviceId: serviceId || undefined,
      productId: productId || undefined,
    });
  }

  @Post('service-links')
  async link(
    @Param('businessId') businessId: string,
    @Body() dto: LinkServiceProductDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.linkToService(
      businessId,
      dto.serviceId,
      dto.productId,
      dto.quantityPerService ?? 1,
    );
  }

  @Delete('service-links/:linkId')
  async unlink(
    @Param('businessId') businessId: string,
    @Param('linkId') linkId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.inventoryService.unlinkServiceProduct(linkId, businessId);
  }

  @Get('recommendations/services/:serviceId')
  async listServiceRecommendations(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const productIds =
      await this.productRecommendationService.listServiceRecommendations(
        businessId,
        serviceId,
      );
    return { productIds };
  }

  @Put('recommendations/services/:serviceId')
  async setServiceRecommendations(
    @Param('businessId') businessId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: SetRecommendedProductsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const productIds =
      await this.productRecommendationService.setServiceRecommendations(
        businessId,
        serviceId,
        dto.productIds,
      );
    return { productIds };
  }

  @Get('recommendations/categories/:categoryId')
  async listCategoryRecommendations(
    @Param('businessId') businessId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const productIds =
      await this.productRecommendationService.listCategoryRecommendations(
        businessId,
        categoryId,
      );
    return { productIds };
  }

  @Put('recommendations/categories/:categoryId')
  async setCategoryRecommendations(
    @Param('businessId') businessId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: SetRecommendedProductsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const productIds =
      await this.productRecommendationService.setCategoryRecommendations(
        businessId,
        categoryId,
        dto.productIds,
      );
    return { productIds };
  }
}
