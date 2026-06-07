import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessModule } from '../business/business.module.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ClinicSpecimen } from '../clinic-test-results/entities/clinic-specimen.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { ClinicTestResultMeasurement } from '../clinic-test-results/entities/clinic-test-result-measurement.entity.js';
import { ClinicLabRegistryController } from './clinic-lab-registry.controller.js';
import { ClinicLabRegistryService } from './clinic-lab-registry.service.js';
import { ClinicLabSyncInboundQueueService } from './clinic-lab-sync-inbound-queue.service.js';
import { ClinicLabSyncInboundWebhookController } from './clinic-lab-sync-inbound-webhook.controller.js';
import { ClinicLabSyncInboundWorkerScheduler } from './clinic-lab-sync-inbound-worker.scheduler.js';
import { ClinicLabSyncInboundWorkerService } from './clinic-lab-sync-inbound-worker.service.js';
import { ClinicLabSyncObservationController } from './clinic-lab-sync-observation.controller.js';
import { ClinicLabSyncObservationService } from './clinic-lab-sync-observation.service.js';
import { ClinicLabInfo } from './entities/clinic-lab-info.entity.js';
import { ClinicLabMachine } from './entities/clinic-lab-machine.entity.js';
import { ClinicLabSyncInboundMessage } from './entities/clinic-lab-sync-inbound-message.entity.js';
import { ClinicLabSyncObservationRequest } from './entities/clinic-lab-sync-observation-request.entity.js';
import { ClinicLabSyncObservationResult } from './entities/clinic-lab-sync-observation-result.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicLabInfo,
      ClinicLabMachine,
      ClinicLabSyncInboundMessage,
      ClinicLabSyncObservationRequest,
      ClinicLabSyncObservationResult,
      ClinicSpecimen,
      ClinicTestResult,
      ClinicTestResultMeasurement,
      Employee,
    ]),
    BusinessModule,
  ],
  controllers: [
    ClinicLabRegistryController,
    ClinicLabSyncObservationController,
    ClinicLabSyncInboundWebhookController,
  ],
  providers: [
    ClinicLabRegistryService,
    ClinicLabSyncObservationService,
    ClinicLabSyncInboundQueueService,
    ClinicLabSyncInboundWorkerService,
    ClinicLabSyncInboundWorkerScheduler,
  ],
  exports: [
    ClinicLabRegistryService,
    ClinicLabSyncObservationService,
    ClinicLabSyncInboundQueueService,
    ClinicLabSyncInboundWorkerService,
  ],
})
export class ClinicLisModule {}
