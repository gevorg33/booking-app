import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EmployeeService } from './employee.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller('businesses/:businessId/employees')
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('businessId') businessId: string, @Body() dto: CreateEmployeeDto, @CurrentUser() user: any) {
    return this.employeeService.create(businessId, dto, user?.id);
  }

  @Get()
  findAll(@Param('businessId') businessId: string) {
    return this.employeeService.findAll(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() user: any) {
    return this.employeeService.update(id, dto, user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}
