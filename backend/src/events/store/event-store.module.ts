import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventStoreService } from './event-store.service.js';
import { OperationalEvent } from './event-store.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([OperationalEvent])],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}
