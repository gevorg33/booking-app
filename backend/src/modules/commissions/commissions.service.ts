import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CommissionRule } from './entities/commission-rule.entity.js';
import { Booking, BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { parseDateRange } from '../analytics/dto/analytics-query.dto.js';
import {
  buildPayoutExportRows,
  payoutExportRowsToCsv,
} from '../../common/utils/commission-payout.util.js';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectRepository(CommissionRule) private ruleRepo: Repository<CommissionRule>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  async list(businessId: string): Promise<CommissionRule[]> {
    return this.ruleRepo.find({
      where: { businessId, isActive: true },
      relations: { employee: true, service: true },
    });
  }

  async create(businessId: string, dto: Partial<CommissionRule>): Promise<CommissionRule> {
    return this.ruleRepo.save(
      this.ruleRepo.create({
        businessId,
        employeeId: dto.employeeId || undefined,
        serviceId: dto.serviceId || undefined,
        type: dto.type || 'percent',
        value: dto.value ?? 0,
      }),
    );
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.ruleRepo.update({ id, businessId }, { isActive: false });
  }

  async exportPayoutCsv(
    businessId: string,
    from?: string,
    to?: string,
    locationId?: string,
  ): Promise<{ filename: string; content: string; rowCount: number }> {
    const { start, end } = parseDateRange(from, to);
    const rules = await this.ruleRepo.find({ where: { businessId, isActive: true } });

    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.service', 'service')
      .leftJoinAndSelect('b.employee', 'employee')
      .where('b.business_id = :businessId', { businessId })
      .andWhere('b.startTime BETWEEN :start AND :end', { start, end })
      .andWhere('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .orderBy('b.startTime', 'ASC');

    if (locationId) {
      qb.andWhere('b.location_id = :locationId', { locationId });
    }

    const bookings = await qb.getMany();
    const rows = buildPayoutExportRows(bookings, rules);
    const fromLabel = start.toISOString().slice(0, 10);
    const toLabel = end.toISOString().slice(0, 10);

    return {
      filename: `commission-payout-${fromLabel}-${toLabel}.csv`,
      content: payoutExportRowsToCsv(rows),
      rowCount: rows.length,
    };
  }
}
