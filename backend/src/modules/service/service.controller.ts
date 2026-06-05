import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ServiceService } from './service.service.js';
import {
  CreateServiceDto,
  UpdateServiceDto,
} from './dto/create-service.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/services')
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceService.create(businessId, dto, user?.id);
  }

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.serviceService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceService.update(id, dto, user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
