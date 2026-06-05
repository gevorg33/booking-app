import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/create-customer.dto.js';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('businesses/:businessId/customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Get('dashboard')
  searchDashboard(
    @Param('businessId') businessId: string,
    @Query() query: GetCustomersQueryDto,
  ) {
    return this.customerService.searchDashboard(businessId, query);
  }

  @Post()
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customerService.create(businessId, dto);
  }

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.customerService.findAll(businessId);
  }

  @Get(':id/detail')
  getDetail(@Param('businessId') businessId: string, @Param('id') id: string) {
    return this.customerService.getCustomerDetail(businessId, id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
