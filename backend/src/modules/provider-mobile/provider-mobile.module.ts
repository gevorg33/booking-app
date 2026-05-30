import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ProviderAiSuggestionsService } from './provider-ai-suggestions.service.js';
import { ProviderPushActionService } from './provider-push-action.service.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';
import { AiModule } from '../ai/ai.module.js';
import { PushSubscription } from './entities/push-subscription.entity.js';
import { NativePushToken } from './entities/native-push-token.entity.js';
import { ProviderMobileService } from './provider-mobile.service.js';
import { ProviderAiCommandService } from './provider-ai-command.service.js';
import { PushService } from './push.service.js';
import { ProviderMobileController } from './provider-mobile.controller.js';
import { ProviderPushListener } from './listeners/provider-push.listener.js';
import { ProviderEndOfDayPushScheduler } from './provider-end-of-day-push.scheduler.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, BusinessMember, Booking, SchedulingSlot, SchedulingPeriod, PushSubscription, NativePushToken, Service]),
    BusinessModule,
    BookingModule,
    AgentModule,
    forwardRef(() => AiModule),
  ],
  controllers: [ProviderMobileController],
  providers: [ProviderMobileService, ProviderAiCommandService, ProviderAiSuggestionsService, PushService, ProviderPushListener, ProviderPushActionService, ProviderEndOfDayPushScheduler],
  exports: [ProviderMobileService, PushService, ProviderPushActionService, ProviderAiCommandService],
})
export class ProviderMobileModule {}
