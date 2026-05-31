import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { ReviewsService } from './reviews.service.js';
import { ReviewsController } from './reviews.controller.js';
import { BusinessModule } from '../business/business.module.js';
import { FirebaseAdminModule } from '../../common/firebase/firebase-admin.module.js';
import { EventStoreModule } from '../../events/store/event-store.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Employee, Booking, Business, Customer]),
    BusinessModule,
    FirebaseAdminModule,
    EventStoreModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
