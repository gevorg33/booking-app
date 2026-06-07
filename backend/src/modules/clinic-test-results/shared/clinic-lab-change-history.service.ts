import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { ClinicLabStaffContext } from '../../../common/utils/clinic-lab-access.util.js';
import type { BookingPhiAccessTarget } from '../../../common/utils/phi-minimum-access.util.js';
import type { PhiStaffContext } from '../../compliance/phi-field.service.js';
import { BusinessService } from '../../business/business.service.js';
import { ClinicTestOrder } from '../entities/clinic-test-order.entity.js';
import { ClinicTestOrderStatusHistory } from '../entities/clinic-test-order-status-history.entity.js';
import { ClinicTestResult } from '../entities/clinic-test-result.entity.js';
import { ClinicTestResultStatusHistory } from '../entities/clinic-test-result-status-history.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from './clinic-test-results-gate.util.js';
import { ClinicLabPhiService } from './clinic-lab-phi.service.js';
import {
  mapClinicLabStatusHistoryRow,
  sortClinicLabChangeHistoryItems,
  type ClinicLabChangeHistoryItem,
} from './clinic-lab-change-history.util.js';

@Injectable()
export class ClinicLabChangeHistoryService {
  constructor(
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(ClinicTestOrderStatusHistory)
    private readonly orderHistoryRepo: Repository<ClinicTestOrderStatusHistory>,
    @InjectRepository(ClinicTestResult)
    private readonly resultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicTestResultStatusHistory)
    private readonly resultHistoryRepo: Repository<ClinicTestResultStatusHistory>,
    private readonly businessService: BusinessService,
    private readonly clinicLabPhiService: ClinicLabPhiService,
  ) {}

  private async assertEnabled(businessId: string): Promise<void> {
    const business = await this.businessService.findOne(businessId);
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }

  private toPhiStaffContext(ctx: ClinicLabStaffContext): PhiStaffContext {
    return {
      userId: ctx.userId,
      role: String(ctx.membershipRole),
      employeeId: ctx.employeeId,
    };
  }

  private async decryptHistoryNote(
    businessId: string,
    bookingAccess: BookingPhiAccessTarget | null,
    ctx: ClinicLabStaffContext,
    note: string | null | undefined,
  ): Promise<string | null> {
    if (!note?.trim()) return null;
    const business = await this.businessService.findOne(businessId);
    const staff = this.toPhiStaffContext(ctx);
    const decrypted =
      await this.clinicLabPhiService.decryptStatusHistoryNoteForStaff(
        business,
        note,
        staff,
        bookingAccess ?? { employeeId: '', linkedEmployeeIds: [] },
      );
    return decrypted ?? null;
  }

  private async mapOrderHistoryRows(
    businessId: string,
    orderId: string,
    bookingAccess: BookingPhiAccessTarget | null,
    ctx: ClinicLabStaffContext,
    rows: ClinicTestOrderStatusHistory[],
  ): Promise<ClinicLabChangeHistoryItem[]> {
    const mapped: ClinicLabChangeHistoryItem[] = [];
    for (const row of rows) {
      const note = await this.decryptHistoryNote(
        businessId,
        bookingAccess,
        ctx,
        row.note,
      );
      mapped.push(mapClinicLabStatusHistoryRow('order', orderId, row, note));
    }
    return mapped;
  }

  private async mapResultHistoryRows(
    businessId: string,
    resultId: string,
    bookingAccess: BookingPhiAccessTarget | null,
    ctx: ClinicLabStaffContext,
    rows: ClinicTestResultStatusHistory[],
  ): Promise<ClinicLabChangeHistoryItem[]> {
    const mapped: ClinicLabChangeHistoryItem[] = [];
    for (const row of rows) {
      const note = await this.decryptHistoryNote(
        businessId,
        bookingAccess,
        ctx,
        row.note,
      );
      mapped.push(mapClinicLabStatusHistoryRow('result', resultId, row, note));
    }
    return mapped;
  }

  async listOrderChangeHistory(
    businessId: string,
    orderId: string,
    ctx: ClinicLabStaffContext,
    bookingAccess: BookingPhiAccessTarget | null,
  ): Promise<ClinicLabChangeHistoryItem[]> {
    await this.assertEnabled(businessId);

    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
      select: { id: true, bookingId: true },
    });
    if (!order) {
      throw new NotFoundException('Clinic test order not found');
    }

    const rows = await this.orderHistoryRepo.find({
      where: { orderId: order.id },
      relations: { employee: true },
      order: { createdAt: 'DESC' },
    });

    return this.mapOrderHistoryRows(
      businessId,
      order.id,
      bookingAccess,
      ctx,
      rows,
    );
  }

  async listResultChangeHistory(
    businessId: string,
    resultId: string,
    ctx: ClinicLabStaffContext,
    bookingAccess: BookingPhiAccessTarget | null,
  ): Promise<ClinicLabChangeHistoryItem[]> {
    await this.assertEnabled(businessId);

    const result = await this.resultRepo.findOne({
      where: { id: resultId, businessId },
      select: { id: true, bookingId: true },
    });
    if (!result) {
      throw new NotFoundException('Clinic test result not found');
    }

    const rows = await this.resultHistoryRepo.find({
      where: { resultId: result.id },
      relations: { employee: true },
      order: { createdAt: 'DESC' },
    });

    return this.mapResultHistoryRows(
      businessId,
      result.id,
      bookingAccess,
      ctx,
      rows,
    );
  }

  async listBookingLabChangeHistory(
    businessId: string,
    bookingId: string,
    ctx: ClinicLabStaffContext,
    bookingAccess: BookingPhiAccessTarget,
  ): Promise<ClinicLabChangeHistoryItem[]> {
    await this.assertEnabled(businessId);

    const [orders, results] = await Promise.all([
      this.orderRepo.find({
        where: { businessId, bookingId },
        select: { id: true },
      }),
      this.resultRepo.find({
        where: { businessId, bookingId },
        select: { id: true },
      }),
    ]);

    const orderIds = orders.map((order) => order.id);
    const resultIds = results.map((result) => result.id);

    const [orderRows, resultRows] = await Promise.all([
      orderIds.length
        ? this.orderHistoryRepo.find({
            where: { orderId: In(orderIds) },
            relations: { employee: true },
            order: { createdAt: 'DESC' },
          })
        : Promise.resolve([]),
      resultIds.length
        ? this.resultHistoryRepo.find({
            where: { resultId: In(resultIds) },
            relations: { employee: true },
            order: { createdAt: 'DESC' },
          })
        : Promise.resolve([]),
    ]);

    const orderHistoryById = new Map<string, ClinicLabChangeHistoryItem[]>();
    for (const orderId of orderIds) {
      const rows = orderRows.filter((row) => row.orderId === orderId);
      orderHistoryById.set(
        orderId,
        await this.mapOrderHistoryRows(
          businessId,
          orderId,
          bookingAccess,
          ctx,
          rows,
        ),
      );
    }

    const resultHistoryById = new Map<string, ClinicLabChangeHistoryItem[]>();
    for (const resultId of resultIds) {
      const rows = resultRows.filter((row) => row.resultId === resultId);
      resultHistoryById.set(
        resultId,
        await this.mapResultHistoryRows(
          businessId,
          resultId,
          bookingAccess,
          ctx,
          rows,
        ),
      );
    }

    return sortClinicLabChangeHistoryItems([
      ...orderIds.flatMap((id) => orderHistoryById.get(id) ?? []),
      ...resultIds.flatMap((id) => resultHistoryById.get(id) ?? []),
    ]);
  }
}
