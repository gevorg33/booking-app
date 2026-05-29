import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowModule } from '../workflow/workflow.module.js';
import { OpenAiModule } from '../../modules/integrations/openai/openai.module.js';
import { BookingModule } from '../../modules/booking/booking.module.js';
import { Business } from '../../modules/business/entities/business.entity.js';
import { AgentToolBridgeService } from './services/agent-tool-bridge.service.js';
import { BookingAgentRouterService } from './services/booking-agent-router.service.js';
import { CancellationRecoveryGraphService } from './services/cancellation-recovery-graph.service.js';
import { ConflictResolutionGraphService } from './services/conflict-resolution-graph.service.js';
import { SchedulingOptimizationGraphService } from './services/scheduling-optimization-graph.service.js';
import { ReactBookingAgentService } from './services/react-booking-agent.service.js';
import { BookingToolRegistryService } from './tools/booking-tool-registry.service.js';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Business]),
    forwardRef(() => WorkflowModule),
    forwardRef(() => BookingModule),
    OpenAiModule,
  ],
  providers: [
    AgentToolBridgeService,
    BookingAgentRouterService,
    BookingToolRegistryService,
    CancellationRecoveryGraphService,
    ConflictResolutionGraphService,
    SchedulingOptimizationGraphService,
    ReactBookingAgentService,
  ],
  exports: [
    AgentToolBridgeService,
    BookingAgentRouterService,
    BookingToolRegistryService,
    CancellationRecoveryGraphService,
    ConflictResolutionGraphService,
    SchedulingOptimizationGraphService,
    ReactBookingAgentService,
  ],
})
export class LangGraphModule {}
