import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity.js';
import { BusinessMember } from './entities/business-member.entity.js';
import { BusinessService } from './business.service.js';
import { DashboardService } from './dashboard.service.js';
import { TeamMembersService } from './team-members.service.js';
import { TenantMemberContactService } from './tenant-member-contact.service.js';
import { BusinessController } from './business.controller.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { User } from '../user/entities/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      BusinessMember,
      Booking,
      Employee,
      Service,
      Customer,
      SchedulingSlot,
      User,
    ]),
  ],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    DashboardService,
    TeamMembersService,
    TenantMemberContactService,
  ],
  exports: [
    BusinessService,
    DashboardService,
    TenantMemberContactService,
    TeamMembersService,
  ],
})
export class BusinessModule {}
