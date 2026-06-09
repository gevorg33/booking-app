import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { BusinessMember } from '../business/entities/business-member.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { User } from '../user/entities/user.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Review } from '../reviews/entities/review.entity.js';
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
import { GiftCardFulfillmentPushListener } from './listeners/gift-card-fulfillment-push.listener.js';
import { ProviderEndOfDayPushScheduler } from './provider-end-of-day-push.scheduler.js';
import { GiftCardsModule } from '../gift-cards/gift-cards.module.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { RetailPosModule } from '../retail-pos/retail-pos.module.js';
import { ClinicTestResultsModule } from '../clinic-test-results/clinic-test-results.module.js';
import { PatientClinicalProfilesModule } from '../patient-clinical-profiles/patient-clinical-profiles.module.js';
import { ClinicTasksModule } from '../clinic-tasks/clinic-tasks.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { MultiServiceBookingGroup } from '../multi-service-bookings/entities/multi-service-booking-group.entity.js';
import {
  CustomerSubscription,
  SubscriptionPlan,
} from '../service-subscriptions/entities/subscription.entity.js';
import { ClinicPreVisitIntakesModule } from '../clinic-pre-visit-intakes/clinic-pre-visit-intakes.module.js';
import { ClinicQuestionnairesModule } from '../clinic-questionnaires/clinic-questionnaires.module.js';
import { ClinicPreVisitIntake } from '../clinic-pre-visit-intakes/entities/clinic-pre-visit-intake.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { ScheduleModule } from '../schedule/schedule.module.js';
import { ProviderTimeOffRequest } from './entities/provider-time-off-request.entity.js';
import { ProviderTimeOffService } from './provider-time-off.service.js';
import { ProviderTimeOffDashboardController } from './provider-time-off-dashboard.controller.js';
import { ProviderPushNotification } from './entities/provider-push-notification.entity.js';
import { ProviderPushHistoryService } from './provider-push-history.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      BusinessMember,
      Booking,
      Business,
      User,
      GiftCard,
      SchedulingSlot,
      SchedulingPeriod,
      PushSubscription,
      NativePushToken,
      Service,
      Customer,
      Review,
      MultiServiceBookingGroup,
      CustomerSubscription,
      SubscriptionPlan,
      ClinicPreVisitIntake,
      ProviderTimeOffRequest,
      ProviderPushNotification,
    ]),
    ClinicPreVisitIntakesModule,
    ClinicQuestionnairesModule,
    BusinessModule,
    forwardRef(() => BookingModule),
    forwardRef(() => GiftCardsModule),
    forwardRef(() => AgentModule),
    SchedulingEngineModule,
    forwardRef(() => AiModule),
    RetailPosModule,
    ClinicTestResultsModule,
    PatientClinicalProfilesModule,
    ClinicTasksModule,
    LoyaltyModule,
    NotificationsModule,
    ReviewsModule,
    ScheduleModule,
  ],
  controllers: [ProviderMobileController, ProviderTimeOffDashboardController],
  providers: [
    ProviderMobileService,
    ProviderTimeOffService,
    ProviderAiCommandService,
    ProviderAiSuggestionsService,
    PushService,
    ProviderPushListener,
    GiftCardFulfillmentPushListener,
    ProviderPushActionService,
    ProviderEndOfDayPushScheduler,
    ProviderPushHistoryService,
  ],
  exports: [
    ProviderMobileService,
    PushService,
    ProviderPushActionService,
    ProviderAiCommandService,
    ProviderTimeOffService,
    ProviderPushHistoryService,
  ],
})
export class ProviderMobileModule {}
