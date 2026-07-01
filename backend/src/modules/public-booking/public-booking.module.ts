import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PublicBookingController } from './public-booking.controller.js';
import { PublicBookingService } from './public-booking.service.js';
import { PublicBookingAssistantService } from './public-booking-assistant.service.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import { PublicCustomerJwtStrategy } from './public-customer-jwt.strategy.js';
import { PublicCustomerAuthGuard } from './public-customer-auth.guard.js';
import { OptionalPublicCustomerAuthGuard } from './optional-public-customer-auth.guard.js';
import { BusinessModule } from '../business/business.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { CustomerModule } from '../customer/customer.module.js';
import { GiftCardsModule } from '../gift-cards/gift-cards.module.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Review } from '../reviews/entities/review.entity.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { PlanEntitlementsModule } from '../billing/plan-entitlements.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { OpenAiModule } from '../integrations/openai/openai.module.js';
import { FirebaseAdminModule } from '../../common/firebase/firebase-admin.module.js';
import { PromoCodesModule } from '../promo-codes/promo-codes.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { ServiceSubscriptionsModule } from '../service-subscriptions/service-subscriptions.module.js';
import { ServicePackagesModule } from '../service-packages/service-packages.module.js';
import { MultiServiceBookingsModule } from '../multi-service-bookings/multi-service-bookings.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AiModule } from '../ai/ai.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ClinicTestResultsModule } from '../clinic-test-results/clinic-test-results.module.js';
import { PatientClinicalProfilesModule } from '../patient-clinical-profiles/patient-clinical-profiles.module.js';
import { ClinicPreVisitIntakesModule } from '../clinic-pre-visit-intakes/clinic-pre-visit-intakes.module.js';
import { PublicPreVisitIntakeService } from './public-pre-visit-intake.service.js';
import { ReferralProgramModule } from '../referral-program/referral-program.module.js';
import { ShareRewardsModule } from '../share-rewards/share-reward.module.js';
import { ZendeskModule } from '../integrations/zendesk/zendesk.module.js';
import { StripeIntegrationModule } from '../billing/stripe-integration.module.js';
import { PublicConsumerSupportService } from './public-consumer-support.service.js';
import { PublicCustomerWaitlistService } from './public-customer-waitlist.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      Service,
      SchedulingSlot,
      SchedulingPeriod,
      Customer,
      Booking,
      Review,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwtSecret')!,
        signOptions: {
          expiresIn: config.get<string>('app.jwtExpiration')! as any,
        },
      }),
    }),
    FirebaseAdminModule,
    BusinessModule,
    forwardRef(() => BookingModule),
    CustomerModule,
    SchedulingEngineModule,
    StripeIntegrationModule,
    PlanEntitlementsModule,
    ReviewsModule,
    OpenAiModule,
    forwardRef(() => PromoCodesModule),
    LoyaltyModule,
    forwardRef(() => ReferralProgramModule),
    forwardRef(() => ShareRewardsModule),
    ServiceSubscriptionsModule,
    ServicePackagesModule,
    MultiServiceBookingsModule,
    NotificationsModule,
    forwardRef(() => GiftCardsModule),
    forwardRef(() => AiModule),
    InventoryModule,
    ClinicTestResultsModule,
    PatientClinicalProfilesModule,
    ClinicPreVisitIntakesModule,
    ZendeskModule,
  ],
  controllers: [PublicBookingController],
  providers: [
    PublicBookingService,
    PublicBookingAssistantService,
    PublicCustomerAuthService,
    PublicCustomerBookingService,
    PublicCustomerJwtStrategy,
    PublicCustomerAuthGuard,
    OptionalPublicCustomerAuthGuard,
    PublicPreVisitIntakeService,
    PublicConsumerSupportService,
    PublicCustomerWaitlistService,
  ],
  exports: [
    PublicBookingService,
    PublicBookingAssistantService,
    PublicCustomerAuthService,
    PublicCustomerBookingService,
    PublicCustomerWaitlistService,
    PublicConsumerSupportService,
  ],
})
export class PublicBookingModule {}
