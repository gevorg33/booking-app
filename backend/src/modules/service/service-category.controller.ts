import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ServiceCategoryService } from './service-category.service.js';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from './dto/service-category.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('businesses/:businessId/service-categories')
export class ServiceCategoryController {
  constructor(private categoryService: ServiceCategoryService) {}

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.categoryService.findAll(businessId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('businessId') businessId: string, @Body() dto: CreateServiceCategoryDto) {
    return this.categoryService.create(businessId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.categoryService.update(id, businessId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.categoryService.remove(id, businessId);
  }
}
