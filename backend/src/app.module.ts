import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';

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
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { CommissionsModule } from './modules/commissions/commissions.module.js';
import { ExpensesModule } from './modules/expenses/expenses.module.js';

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
    InventoryModule,
    CommissionsModule,
    ExpensesModule,

    // Engine
    SchedulingEngineModule,
    WorkflowModule,
    PolicyModule,
    AgentModule,
  ],
})
export class AppModule {}
