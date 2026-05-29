import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity.js';
import { BookingCheckoutDraft } from './entities/booking-checkout-draft.entity.js';
import { BookingService } from './booking.service.js';
import { BookingPaymentService } from './booking-payment.service.js';
import { BookingSlotResolverService } from './booking-slot-resolver.service.js';
import { BookingController } from './booking.controller.js';
import { BookingCreatedListener } from './listeners/booking-created.listener.js';
import { BookingCompletedListener } from './listeners/booking-completed.listener.js';
import { BookingLifecycleListener } from './listeners/booking-lifecycle.listener.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AgentController } from './agent.controller.js';
import { SchedulingSlot } from '../schedule/entities/scheduling-slot.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { SchedulingEngineModule } from '../../engine/scheduling/scheduling-engine.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';
import { AgentModule } from '../../engine/agent/agent.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { CustomerModule } from '../customer/customer.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingCheckoutDraft,
      SchedulingSlot,
      SchedulingPeriod,
      Service,
      Customer,
      Business,
    ]),
    SchedulingEngineModule,
    EventStoreModule,
    forwardRef(() => BillingModule),
    CustomerModule,
    forwardRef(() => AgentModule),
    LoyaltyModule,
    InventoryModule,
    ReviewsModule,
    NotificationsModule,
  ],
  controllers: [BookingController, AgentController],
  providers: [
    BookingService,
    BookingPaymentService,
    BookingSlotResolverService,
    BookingCreatedListener,
    BookingCompletedListener,
    BookingLifecycleListener,
  ],
  exports: [BookingService, BookingPaymentService, BookingSlotResolverService],
})
export class BookingModule {}
