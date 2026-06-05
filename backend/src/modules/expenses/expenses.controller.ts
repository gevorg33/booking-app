import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(
    private expensesService: ExpensesService,
    private businessService: BusinessService,
  ) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @Query('locationId') locationId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.expensesService.list(businessId, locationId);
  }

  @Post()
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.expensesService.create(businessId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    await this.expensesService.remove(id, businessId);
    return { ok: true };
  }
}
