import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('businesses/:businessId/customers')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('businessId') businessId: string, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(businessId, dto);
  }

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.customerService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
