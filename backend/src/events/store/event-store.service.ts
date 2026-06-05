import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OperationalEvent } from './event-store.entity.js';
import { DomainEvent, EventType } from '../event-types.js';

@Injectable()
export class EventStoreService {
  constructor(
    @InjectRepository(OperationalEvent)
    private eventRepo: Repository<OperationalEvent>,
    private eventEmitter: EventEmitter2,
  ) {}

  async publish(event: DomainEvent): Promise<OperationalEvent> {
    const storedEvent = this.eventRepo.create({
      id: event.id || crypto.randomUUID(),
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      businessId: event.businessId,
      payload: event.payload,
      metadata: event.metadata || {},
      causationId: event.causationId,
      correlationId: event.correlationId || crypto.randomUUID(),
      userId: event.userId,
    });

    const saved = await this.eventRepo.save(storedEvent);

    this.eventEmitter.emit(event.eventType, saved);
    this.eventEmitter.emit('domain.event', saved);

    return saved;
  }

  async getEvents(filters: {
    aggregateType?: string;
    aggregateId?: string;
    eventType?: EventType;
    businessId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<OperationalEvent[]> {
    const qb = this.eventRepo.createQueryBuilder('event');

    if (filters.aggregateType) {
      qb.andWhere('event.aggregateType = :aggregateType', {
        aggregateType: filters.aggregateType,
      });
    }
    if (filters.aggregateId) {
      qb.andWhere('event.aggregateId = :aggregateId', {
        aggregateId: filters.aggregateId,
      });
    }
    if (filters.eventType) {
      qb.andWhere('event.eventType = :eventType', {
        eventType: filters.eventType,
      });
    }
    if (filters.businessId) {
      qb.andWhere('event.businessId = :businessId', {
        businessId: filters.businessId,
      });
    }
    if (filters.startDate && filters.endDate) {
      qb.andWhere('event.createdAt BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    qb.orderBy('event.createdAt', 'DESC');
    if (filters.limit) qb.take(filters.limit);

    return qb.getMany();
  }

  async getEventsByCorrelation(
    correlationId: string,
  ): Promise<OperationalEvent[]> {
    return this.eventRepo.find({
      where: { correlationId },
      order: { createdAt: 'ASC' },
    });
  }
}
