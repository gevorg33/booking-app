import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessInvitation } from './entities/business-invitation.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import { User } from '../user/entities/user.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { InvitationsService } from './invitations.service.js';
import {
  InvitationsController,
  PublicInvitationsController,
} from './invitations.controller.js';
import { BusinessModule } from '../business/business.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessInvitation,
      BusinessMember,
      User,
      Employee,
    ]),
    BusinessModule,
    NotificationsModule,
    AuthModule,
  ],
  controllers: [InvitationsController, PublicInvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
