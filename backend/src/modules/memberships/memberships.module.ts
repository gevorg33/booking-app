import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPlan, CustomerMembership } from './entities/membership-plan.entity.js';
import { MembershipsService } from './memberships.service.js';
import { MembershipsController } from './memberships.controller.js';
import { BusinessModule } from '../business/business.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipPlan, CustomerMembership]), BusinessModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
