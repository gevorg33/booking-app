import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';

// Domain modules
import { AuthModule } from './modules/auth/auth.module.js';
import { BusinessModule } from './modules/business/business.module.js';
import { EmployeeModule } from './modules/employee/employee.module.js';
import { CustomerModule } from './modules/customer/customer.module.js';
import { ServiceModule } from './modules/service/service.module.js';
import { ScheduleModule } from './modules/schedule/schedule.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { BillingModule } from './modules/billing/billing.module.js';

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

    // Infrastructure
    EventStoreModule,
    WebSocketModule,

    // Domain
    AuthModule,
    BusinessModule,
    EmployeeModule,
    CustomerModule,
    ServiceModule,
    ScheduleModule,
    BookingModule,
    AiModule,
    BillingModule,

    // Engine
    SchedulingEngineModule,
    WorkflowModule,
    PolicyModule,
    AgentModule,
  ],
})
export class AppModule {}
