import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';
import { PushSubscription } from './entities/push-subscription.entity.js';
import { NativePushToken } from './entities/native-push-token.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import { PushService } from './push.service.js';
import { ProviderMobileController } from './provider-mobile.controller.js';
import { ProviderPushListener } from './listeners/provider-push.listener.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Booking, SchedulingSlot, PushSubscription, NativePushToken]),
    BusinessModule,
    BookingModule,
    AgentModule,
  ],
  controllers: [ProviderMobileController],
  providers: [ProviderMobileService, PushService, ProviderPushListener],
  exports: [ProviderMobileService, PushService],
})
export class ProviderMobileModule {}
