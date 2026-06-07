import { Module, forwardRef } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { BusinessModule } from '../business/business.module.js';
import { Business } from '../business/entities/business.entity.js';
import { ComplianceModule } from '../compliance/compliance.module.js';
import { ClinicTasksModule } from '../clinic-tasks/clinic-tasks.module.js';
import { ClinicDiagnosticCodesModule } from '../clinic-diagnostic-codes/clinic-diagnostic-codes.module.js';
import { ClinicDiagnosticCode } from '../clinic-diagnostic-codes/entities/clinic-diagnostic-code.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ClinicSpecimen } from './entities/clinic-specimen.entity.js';
import { ClinicSpecimenStatusHistory } from './entities/clinic-specimen-status-history.entity.js';
import { ClinicSpecimenStorageLocation } from './entities/clinic-specimen-storage-location.entity.js';
import { ClinicTransportFolder } from './entities/clinic-transport-folder.entity.js';
import { ClinicTestOrder } from './entities/clinic-test-order.entity.js';
import { ClinicTestOrderItem } from './entities/clinic-test-order-item.entity.js';
import { ClinicTestOrderStatusHistory } from './entities/clinic-test-order-status-history.entity.js';
import { ClinicTestPanel } from './entities/clinic-test-panel.entity.js';
import { ClinicTestPanelItem } from './entities/clinic-test-panel-item.entity.js';
import { ClinicTestResult } from './entities/clinic-test-result.entity.js';
import { ClinicTestResultMeasurement } from './entities/clinic-test-result-measurement.entity.js';
import { ClinicTestResultStatusHistory } from './entities/clinic-test-result-status-history.entity.js';
import { ClinicTestType } from './entities/clinic-test-type.entity.js';
import { ClinicTestCatalogController } from './catalog/clinic-test-catalog.controller.js';
import { ClinicTestCatalogService } from './catalog/clinic-test-catalog.service.js';
import { ClinicLabSyncObservationResult } from '../clinic-lis/entities/clinic-lab-sync-observation-result.entity.js';
import { ClinicTestResultsController } from './clinic-test-results.controller.js';
import { ClinicTestResultsService } from './clinic-test-results.service.js';
import { ClinicTestOrderStatusService } from './order/clinic-test-order-status.service.js';
import { ClinicTestOrderService } from './order/clinic-test-order.service.js';
import { ClinicTestOrderBookingRequestService } from './order/clinic-test-order-booking-request.service.js';
import { ClinicLabBookingListener } from './listeners/clinic-lab-booking.listener.js';
import { ClinicTestResultReleasedListener } from './listeners/clinic-test-result-released.listener.js';
import { ClinicTestResultStatusService } from './test-result/clinic-test-result-status.service.js';
import { ClinicTestResultService } from './test-result/clinic-test-result.service.js';
import { ClinicTestResultActionService } from './test-result/clinic-test-result-action.service.js';
import { ClinicSpecimenStatusService } from './specimen/clinic-specimen-status.service.js';
import { ClinicSpecimenService } from './specimen/clinic-specimen.service.js';
import { ClinicLabPhiService } from './shared/clinic-lab-phi.service.js';
import { ClinicLabAccessService } from './shared/clinic-lab-access.service.js';
import { ClinicLabChangeHistoryService } from './shared/clinic-lab-change-history.service.js';
import { Employee } from '../employee/entities/employee.entity.js';

const CLINIC_TEST_RESULT_ENTITIES = [
  ClinicTestType,
  ClinicTestPanel,
  ClinicTestPanelItem,
  ClinicTestOrder,
  ClinicTestOrderItem,
  ClinicTestOrderStatusHistory,
  ClinicTestResult,
  ClinicTestResultMeasurement,
  ClinicTestResultStatusHistory,
  ClinicSpecimen,
  ClinicSpecimenStatusHistory,
  ClinicSpecimenStorageLocation,
  ClinicTransportFolder,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ...CLINIC_TEST_RESULT_ENTITIES,
      Service,
      Booking,
      Business,
      Employee,
      ClinicDiagnosticCode,
      ClinicLabSyncObservationResult,
    ]),
    EventStoreModule,
    NotificationsModule,
    BusinessModule,
    ComplianceModule,
    ClinicTasksModule,
    ClinicDiagnosticCodesModule,
    forwardRef(() => BookingModule),
  ],
  controllers: [ClinicTestResultsController, ClinicTestCatalogController],
  providers: [
    ClinicTestResultsService,
    ClinicTestCatalogService,
    ClinicTestOrderStatusService,
    ClinicTestOrderService,
    ClinicTestOrderBookingRequestService,
    ClinicTestResultService,
    ClinicTestResultStatusService,
    ClinicTestResultActionService,
    ClinicSpecimenStatusService,
    ClinicSpecimenService,
    ClinicLabPhiService,
    ClinicLabAccessService,
    ClinicLabChangeHistoryService,
    ClinicLabBookingListener,
    ClinicTestResultReleasedListener,
  ],
  exports: [
    ClinicTestResultsService,
    ClinicTestCatalogService,
    ClinicTestOrderStatusService,
    ClinicTestOrderService,
    ClinicTestOrderBookingRequestService,
    ClinicTestResultService,
    ClinicTestResultStatusService,
    ClinicTestResultActionService,
    ClinicSpecimenStatusService,
    ClinicSpecimenService,
    ClinicLabPhiService,
    ClinicLabAccessService,
    ClinicLabChangeHistoryService,
  ],
})
export class ClinicTestResultsModule {}
