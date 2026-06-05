import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { CommissionRule } from '../commissions/entities/commission-rule.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Business,
      Employee,
      Service,
      Expense,
      CommissionRule,
    ]),
    BusinessModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
