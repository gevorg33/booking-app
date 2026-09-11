import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { FirebaseAdminModule } from './common/firebase/firebase-admin.module.js';
import { SchedulerLockModule } from './common/scheduler-lock/scheduler-lock.module.js';

// Domain modules
import { AuthModule } from './modules/auth/auth.module.js';
import { BusinessModule } from './modules/business/business.module.js';
import { EmployeeModule } from './modules/employee/employee.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { ServiceModule } from './modules/service/service.module.js';
import { ScheduleModule as AppScheduleModule } from './modules/schedule/schedule.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { PublicBookingModule } from './modules/public-booking/public-booking.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { InvitationsModule } from './modules/invitations/invitations.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { GiftCardsModule } from './modules/gift-cards/gift-cards.module.js';
import { MembershipsModule } from './modules/memberships/memberships.module.js';
import { LoyaltyModule } from './modules/loyalty/loyalty.module.js';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { ResourcesModule } from './modules/resources/resources.module.js';
import { ServiceSubscriptionsModule } from './modules/service-subscriptions/service-subscriptions.module.js';
import { ServicePackagesModule } from './modules/service-packages/service-packages.module.js';
import { MultiServiceBookingsModule } from './modules/multi-service-bookings/multi-service-bookings.module.js';
import { CommissionsModule } from './modules/commissions/commissions.module.js';
import { ExpensesModule } from './modules/expenses/expenses.module.js';
import { OnboardingModule } from './modules/onboarding/onboarding.module.js';
import { MarketingAutomationModule } from './modules/marketing-automation/marketing-automation.module.js';
import { RetailPosModule } from './modules/retail-pos/retail-pos.module.js';
import { EnterpriseTrustModule } from './modules/enterprise-trust/enterprise-trust.module.js';
import { StrategyEvalModule } from './modules/strategy-eval/strategy-eval.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { ProviderMobileModule } from './modules/provider-mobile/provider-mobile.module.js';
import { ComplianceModule } from './modules/compliance/compliance.module.js';
import { ClinicTestResultsModule } from './modules/clinic-test-results/clinic-test-results.module.js';
import { PatientClinicalProfilesModule } from './modules/patient-clinical-profiles/patient-clinical-profiles.module.js';
import { ExternalDoctorsModule } from './modules/external-doctors/external-doctors.module.js';
import { ClinicQuestionnairesModule } from './modules/clinic-questionnaires/clinic-questionnaires.module.js';
import { ClinicPreVisitIntakesModule } from './modules/clinic-pre-visit-intakes/clinic-pre-visit-intakes.module.js';
import { ClinicTasksModule } from './modules/clinic-tasks/clinic-tasks.module.js';
import { ClinicLisModule } from './modules/clinic-lis/clinic-lis.module.js';
import { ClinicDiagnosticCodesModule } from './modules/clinic-diagnostic-codes/clinic-diagnostic-codes.module.js';
import { MobileAppModule } from './modules/mobile-app/mobile-app.module.js';

// Engine modules
import { SchedulingEngineModule } from './engine/scheduling/scheduling-engine.module.js';
import { WorkflowModule } from './engine/workflow/workflow.module.js';
import { PolicyModule } from './engine/policy/policy.module.js';
import { AgentModule } from './engine/agent/agent.module.js';

// Infrastructure
import { EventStoreModule } from './events/store/event-store.module.js';
import { WebSocketModule } from './websocket/websocket.module.js';

@Module({
  imports: [
    // Configuration
    ConfigModule,
    DatabaseModule,
    FirebaseAdminModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),

    // Infrastructure
    EventStoreModule,
    WebSocketModule,

    // Domain
    AuthModule,
    BusinessModule,
    EmployeeModule,
    CustomerModule,
    ServiceModule,
    AppScheduleModule,
    BookingModule,
    PublicBookingModule,
    AiModule,
    BillingModule,
    UploadModule,
    NotificationsModule,
    AnalyticsModule,
    LocationsModule,
    InvitationsModule,
    ReviewsModule,
    GiftCardsModule,
    MembershipsModule,
    LoyaltyModule,
    PromoCodesModule,
    InventoryModule,
    ResourcesModule,
    ServiceSubscriptionsModule,
    ServicePackagesModule,
    MultiServiceBookingsModule,
    CommissionsModule,
    ExpensesModule,
    OnboardingModule,
    MarketingAutomationModule,
    RetailPosModule,
    EnterpriseTrustModule,
    StrategyEvalModule,
    IntegrationsModule,
    ProviderMobileModule,
    ComplianceModule,
    ClinicTestResultsModule,
    PatientClinicalProfilesModule,
    ExternalDoctorsModule,
    ClinicQuestionnairesModule,
    ClinicPreVisitIntakesModule,
    ClinicTasksModule,
    ClinicDiagnosticCodesModule,
    ClinicLisModule,
    MobileAppModule,

    // Engine
    SchedulingEngineModule,
    WorkflowModule,
    PolicyModule,
    AgentModule,
    SchedulerLockModule,
  ],
})
export class AppModule {}
