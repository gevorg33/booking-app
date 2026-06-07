import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CLINIC_RESULT_ENTRY_QUEUE_STATUSES,
  CLINIC_RESULT_RELEASE_QUEUE_STATUSES,
  CLINIC_RESULT_REVIEW_QUEUE_STATUSES,
  isClinicTestResultEditable,
} from '../../../common/utils/clinic-lab-state.util.js';
import type { ClinicLabStaffContext } from '../../../common/utils/clinic-lab-access.util.js';
import type { BookingPhiAccessTarget } from '../../../common/utils/phi-minimum-access.util.js';
import type { PhiStaffContext } from '../../compliance/phi-field.service.js';
import { normalizeCatalogMatchKey } from '../catalog/clinic-test-catalog-seed.util.js';
import { resolveClinicalDepartmentLabel } from '../catalog/clinic-test-catalog.util.js';
import { ClinicTestType } from '../entities/clinic-test-type.entity.js';
import { ClinicTestResultStatusService } from './clinic-test-result-status.service.js';
import { ClinicTestOrder } from '../entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../entities/clinic-test-result.entity.js';
import { ClinicTestResultMeasurement } from '../entities/clinic-test-result-measurement.entity.js';
import { ClinicTestResultStatusHistory } from '../entities/clinic-test-result-status-history.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../shared/clinic-test-results-gate.util.js';
import { ClinicLabPhiService } from '../shared/clinic-lab-phi.service.js';
import {
  isLegacyPatientTestResultViewId,
  mapLegacyPatientTestResultRowsToViews,
  parseLegacyPatientTestResultViewId,
} from '../../../common/utils/clinic-legacy-patient-test-results-bridge.util.js';

export type ClinicResultOpsView = 'entry' | 'review' | 'release';

const MANUAL_ENTRY_RELATIONS = {
  measurements: true,
  order: { items: { testType: true } },
} as const;

export interface EnterClinicManualMeasurementInput {
  businessId: string;
  measurementCode: string;
  value: string;
  orderId?: string | null;
  resultId?: string | null;
  employeeId?: string | null;
  staff?: PhiStaffContext;
}

function orderIdMatches(
  candidate: string | null | undefined,
  needle: string,
): boolean {
  if (!candidate || !needle) return false;
  if (candidate === needle) return true;
  if (candidate.startsWith(needle)) return true;
  if (candidate.endsWith(needle)) return true;
  return candidate.includes(needle);
}

export interface ClinicResultListFilters {
  view?: ClinicResultOpsView;
  status?: string;
  statuses?: string[];
  from?: string;
  to?: string;
  department?: string;
  employeeId?: string;
  customerId?: string;
}

export interface ClinicTestResultView {
  id: string;
  businessId: string;
  bookingId: string | null;
  orderId: string | null;
  customerId: string;
  status: string;
  testName: string | null;
  testTypeId: string | null;
  measurementFlag: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: Date;
  comment?: string | null;
  reviewComment?: string | null;
  releaseComment?: string | null;
  phiMasked?: boolean;
  legacySource?: 'booking_metadata';
  legacyMetadataIndex?: number;
}

export interface ClinicTestResultMeasurementView {
  id: string;
  testTypeId: string;
  value: string | null;
  labComment: string | null;
  measurementFlag: string | null;
  receivedAt: string | null;
}

export interface ClinicTestResultDetailView extends ClinicTestResultView {
  measurements: ClinicTestResultMeasurementView[];
}

export interface ClinicResultListAccess {
  ctx: ClinicLabStaffContext;
  bookingAccess: BookingPhiAccessTarget;
  bookingMetadata?: Record<string, unknown> | null;
  customerId?: string;
}

export interface ClinicResultQueueItem {
  id: string;
  status: string;
  testName: string | null;
  orderId: string | null;
  orderStatus: string | null;
  bookingId: string | null;
  customerName: string | null;
  bookingStartTime: string | null;
  employeeName: string | null;
  department: string | null;
  measurementFlag: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: Date;
}

export interface ClinicPatientChartResultView {
  id: string;
  bookingId: string | null;
  orderId: string | null;
  status: string;
  testName: string | null;
  measurementFlag: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

@Injectable()
export class ClinicTestResultService {
  constructor(
    @InjectRepository(ClinicTestResult)
    private readonly resultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicTestResultStatusHistory)
    private readonly resultHistoryRepo: Repository<ClinicTestResultStatusHistory>,
    @InjectRepository(ClinicTestResultMeasurement)
    private readonly measurementRepo: Repository<ClinicTestResultMeasurement>,
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(ClinicTestType)
    private readonly testTypeRepo: Repository<ClinicTestType>,
    private readonly clinicLabPhiService: ClinicLabPhiService,
    private readonly clinicTestResultStatusService: ClinicTestResultStatusService,
  ) {}

  private async assertEnabled(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
    return business;
  }

  private toPhiStaffContext(ctx: ClinicLabStaffContext): PhiStaffContext {
    return {
      userId: ctx.userId,
      role: String(ctx.membershipRole),
      employeeId: ctx.employeeId,
    };
  }

  private mapResultView(result: ClinicTestResult): ClinicTestResultView {
    return {
      id: result.id,
      businessId: result.businessId,
      bookingId: result.bookingId ?? null,
      orderId: result.orderId ?? null,
      customerId: result.customerId,
      status: result.status,
      testName: result.testType?.title ?? result.order?.displayNames ?? null,
      testTypeId: result.testTypeId ?? null,
      measurementFlag: result.measurementFlag ?? null,
      completedAt: result.completedAt?.toISOString() ?? null,
      reviewedAt: result.reviewedAt?.toISOString() ?? null,
      releasedAt: result.releasedAt?.toISOString() ?? null,
      createdAt: result.createdAt,
    };
  }

  private async mapResultViewWithPhi(
    business: Business,
    result: ClinicTestResult,
    access: ClinicResultListAccess,
  ): Promise<ClinicTestResultView> {
    const base = this.mapResultView(result);
    const decrypted = await this.clinicLabPhiService.decryptTestResultForStaff(
      business,
      result,
      this.toPhiStaffContext(access.ctx),
      access.bookingAccess,
    );
    const phiMasked =
      (!!result.comment?.trim() ||
        !!result.reviewComment?.trim() ||
        !!result.releaseComment?.trim()) &&
      !decrypted.comment?.trim() &&
      !decrypted.reviewComment?.trim() &&
      !decrypted.releaseComment?.trim();
    return {
      ...base,
      comment: decrypted.comment ?? null,
      reviewComment: decrypted.reviewComment ?? null,
      releaseComment: decrypted.releaseComment ?? null,
      ...(phiMasked ? { phiMasked: true } : {}),
    };
  }

  private async mapMeasurementViews(
    business: Business,
    measurements: ClinicTestResultMeasurement[],
    access: ClinicResultListAccess,
  ): Promise<ClinicTestResultMeasurementView[]> {
    const staff = this.toPhiStaffContext(access.ctx);
    const mapped: ClinicTestResultMeasurementView[] = [];
    for (const measurement of measurements) {
      const decrypted =
        await this.clinicLabPhiService.decryptMeasurementForStaff(
          business,
          measurement,
          staff,
          access.bookingAccess,
        );
      mapped.push({
        id: measurement.id,
        testTypeId: measurement.testTypeId,
        value: decrypted.value ?? null,
        labComment: decrypted.labComment ?? null,
        measurementFlag: measurement.measurementFlag ?? null,
        receivedAt: measurement.receivedAt?.toISOString() ?? null,
      });
    }
    return mapped;
  }

  private async appendLegacyPatientTestResultViews(
    business: Business,
    bookingId: string,
    access: ClinicResultListAccess,
    structured: ClinicTestResultView[],
  ): Promise<ClinicTestResultView[]> {
    if (!access.customerId) return structured;

    const { rows, phiMasked } =
      await this.clinicLabPhiService.decryptLegacyPatientTestResultsForStaff(
        business,
        bookingId,
        access.bookingMetadata ?? null,
        this.toPhiStaffContext(access.ctx),
        access.bookingAccess,
      );
    if (rows.length === 0) return structured;

    const legacyViews = mapLegacyPatientTestResultRowsToViews({
      businessId: business.id,
      bookingId,
      customerId: access.customerId,
      rows,
      phiMasked,
    });

    return [...structured, ...legacyViews];
  }

  private async resolveLegacyResultDetail(
    business: Business,
    resultId: string,
    access: ClinicResultListAccess,
  ): Promise<ClinicTestResultDetailView> {
    const parsed = parseLegacyPatientTestResultViewId(resultId);
    if (!parsed || !access.customerId) {
      throw new NotFoundException('Clinic test result not found');
    }

    const { rows, phiMasked } =
      await this.clinicLabPhiService.decryptLegacyPatientTestResultsForStaff(
        business,
        parsed.bookingId,
        access.bookingMetadata ?? null,
        this.toPhiStaffContext(access.ctx),
        access.bookingAccess,
      );
    const row = rows[parsed.index];
    if (!row) {
      throw new NotFoundException('Clinic test result not found');
    }

    const [view] = mapLegacyPatientTestResultRowsToViews({
      businessId: business.id,
      bookingId: parsed.bookingId,
      customerId: access.customerId,
      rows: [row],
      phiMasked,
    });

    return { ...view, measurements: [] };
  }

  async ensureResultForOrder(
    orderId: string,
  ): Promise<ClinicTestResult | null> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { items: true },
    });
    if (!order) return null;

    const existing = await this.resultRepo.findOne({
      where: { businessId: order.businessId, orderId: order.id },
    });
    if (existing) return existing;

    const business = await this.businessRepo.findOne({
      where: { id: order.businessId },
    });
    if (!business) return null;

    const testTypeId = order.items?.[0]?.testTypeId ?? null;

    const result = await this.resultRepo.save(
      this.resultRepo.create({
        businessId: order.businessId,
        customerId: order.customerId,
        orderId: order.id,
        bookingId: order.bookingId ?? null,
        testTypeId,
        resultKind: 'test_type',
        status: 'NotReceived',
      }),
    );

    const historyNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        'Auto-created for lab order',
      );
    await this.resultHistoryRepo.save(
      this.resultHistoryRepo.create({
        resultId: result.id,
        status: 'NotReceived',
        previousStatus: null,
        employeeId: order.employeeId ?? null,
        note: historyNote ?? null,
      }),
    );

    return result;
  }

  private async backfillMissingResults(businessId: string): Promise<void> {
    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.results', 'result')
      .where('order.businessId = :businessId', { businessId })
      .andWhere('result.id IS NULL')
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['Collecting', 'AwaitingResults', 'Completed'],
      })
      .getMany();

    for (const order of orders) {
      await this.ensureResultForOrder(order.id);
    }
  }

  private resolveStatusesForView(
    filters: ClinicResultListFilters,
  ): string[] | undefined {
    if (filters.statuses?.length) return filters.statuses;
    if (filters.status?.trim()) return [filters.status.trim()];
    if (filters.view === 'entry') {
      return [...CLINIC_RESULT_ENTRY_QUEUE_STATUSES];
    }
    if (filters.view === 'review') {
      return [...CLINIC_RESULT_REVIEW_QUEUE_STATUSES];
    }
    if (filters.view === 'release') {
      return [...CLINIC_RESULT_RELEASE_QUEUE_STATUSES];
    }
    return undefined;
  }

  async listResultsForBooking(
    businessId: string,
    bookingId: string,
    access?: ClinicResultListAccess,
  ): Promise<ClinicTestResultView[]> {
    const business = await this.assertEnabled(businessId);
    await this.backfillMissingResults(businessId);

    const results = await this.resultRepo.find({
      where: { businessId, bookingId },
      relations: { order: true, testType: true },
      order: { createdAt: 'ASC' },
    });

    if (!access) {
      return results.map((result) => this.mapResultView(result));
    }

    const structured = await Promise.all(
      results.map((result) =>
        this.mapResultViewWithPhi(business, result, access),
      ),
    );

    return this.appendLegacyPatientTestResultViews(
      business,
      bookingId,
      access,
      structured,
    );
  }

  async getResultDetail(
    businessId: string,
    resultId: string,
    access: ClinicResultListAccess,
  ): Promise<ClinicTestResultDetailView> {
    const business = await this.assertEnabled(businessId);

    if (isLegacyPatientTestResultViewId(resultId)) {
      return this.resolveLegacyResultDetail(business, resultId, access);
    }

    const result = await this.resultRepo.findOne({
      where: { id: resultId, businessId },
      relations: { order: true, testType: true, measurements: true },
    });
    if (!result) {
      throw new NotFoundException('Clinic test result not found');
    }

    const view = await this.mapResultViewWithPhi(business, result, access);
    const measurements = await this.mapMeasurementViews(
      business,
      result.measurements ?? [],
      access,
    );

    return { ...view, measurements };
  }

  async listResultQueue(
    businessId: string,
    filters: ClinicResultListFilters = {},
  ): Promise<ClinicResultQueueItem[]> {
    await this.assertEnabled(businessId);
    await this.backfillMissingResults(businessId);

    const statuses = this.resolveStatusesForView(filters);

    const qb = this.resultRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.order', 'order')
      .leftJoinAndSelect('result.testType', 'testType')
      .leftJoinAndSelect('testType.service', 'testTypeService')
      .leftJoinAndSelect('testTypeService.category', 'testTypeCategory')
      .leftJoinAndSelect('order.booking', 'booking')
      .leftJoinAndSelect('booking.customer', 'customer')
      .leftJoinAndSelect('booking.employee', 'employee')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.testType', 'itemTestType')
      .leftJoinAndSelect('itemTestType.service', 'service')
      .leftJoinAndSelect('service.category', 'category')
      .where('result.businessId = :businessId', { businessId });

    if (statuses?.length) {
      qb.andWhere('result.status IN (:...statuses)', { statuses });
    }

    if (filters.employeeId?.trim()) {
      qb.andWhere('booking.employeeId = :employeeId', {
        employeeId: filters.employeeId.trim(),
      });
    }

    if (filters.customerId?.trim()) {
      qb.andWhere('booking.customerId = :customerId', {
        customerId: filters.customerId.trim(),
      });
    }

    if (filters.from?.trim()) {
      qb.andWhere('booking.startTime >= :from', { from: filters.from.trim() });
    }

    if (filters.to?.trim()) {
      qb.andWhere('booking.startTime <= :to', { to: filters.to.trim() });
    }

    if (filters.department?.trim()) {
      qb.andWhere('LOWER(category.name) = LOWER(:department)', {
        department: filters.department.trim(),
      });
    }

    qb.orderBy('result.createdAt', 'DESC');

    const results = await qb.getMany();

    return results.map((result) => {
      const department = resolveClinicalDepartmentLabel(
        result.order?.items?.[0]?.testType?.service?.category?.name ??
          result.testType?.service?.category?.name ??
          null,
      );
      return {
        id: result.id,
        status: result.status,
        testName: result.testType?.title ?? result.order?.displayNames ?? null,
        orderId: result.orderId ?? null,
        orderStatus: result.order?.status ?? null,
        bookingId: result.bookingId ?? null,
        customerName: result.order?.booking?.customer?.name ?? null,
        bookingStartTime: result.order?.booking?.startTime
          ? result.order.booking.startTime.toISOString()
          : null,
        employeeName: result.order?.booking?.employee?.name ?? null,
        department,
        measurementFlag: result.measurementFlag ?? null,
        completedAt: result.completedAt?.toISOString() ?? null,
        reviewedAt: result.reviewedAt?.toISOString() ?? null,
        releasedAt: result.releasedAt?.toISOString() ?? null,
        createdAt: result.createdAt,
      };
    });
  }

  private async resolveResultForManualEntry(
    businessId: string,
    input: Pick<EnterClinicManualMeasurementInput, 'orderId' | 'resultId'>,
  ): Promise<ClinicTestResult> {
    if (input.resultId) {
      const byResult = await this.resultRepo.findOne({
        where: { id: input.resultId, businessId },
        relations: MANUAL_ENTRY_RELATIONS,
      });
      if (byResult) return byResult;

      const results = await this.resultRepo.find({
        where: { businessId },
        relations: MANUAL_ENTRY_RELATIONS,
        order: { createdAt: 'DESC' },
        take: 100,
      });
      const prefixMatch = results.find(
        (row) =>
          row.id === input.resultId || row.id.startsWith(input.resultId ?? ''),
      );
      if (prefixMatch) return prefixMatch;
    }

    if (input.orderId) {
      await this.ensureResultForOrder(input.orderId);
      const byOrder = await this.resultRepo.findOne({
        where: { businessId, orderId: input.orderId },
        relations: MANUAL_ENTRY_RELATIONS,
      });
      if (byOrder) return byOrder;

      const byLinkedOrder = await this.resultRepo.find({
        where: { businessId },
        relations: MANUAL_ENTRY_RELATIONS,
        order: { createdAt: 'DESC' },
        take: 100,
      });
      const linked = byLinkedOrder.find(
        (row) => row.orderId && row.orderId.includes(input.orderId ?? ''),
      );
      if (linked) return linked;

      const orders = await this.orderRepo.find({
        where: { businessId },
        order: { createdAt: 'DESC' },
        take: 100,
      });
      const orderMatch = orders.find((row) =>
        orderIdMatches(row.id, input.orderId ?? ''),
      );
      if (orderMatch) {
        await this.ensureResultForOrder(orderMatch.id);
        const result = await this.resultRepo.findOne({
          where: { businessId, orderId: orderMatch.id },
          relations: MANUAL_ENTRY_RELATIONS,
        });
        if (result) return result;
      }
    }

    throw new NotFoundException('Clinic test result not found');
  }

  async enterManualMeasurement(
    input: EnterClinicManualMeasurementInput,
  ): Promise<{
    result: ClinicTestResult;
    measurement: ClinicTestResultMeasurement;
  }> {
    if (!input.orderId && !input.resultId) {
      throw new BadRequestException('orderId or resultId is required');
    }

    const business = await this.assertEnabled(input.businessId);
    const result = await this.resolveResultForManualEntry(
      input.businessId,
      input,
    );

    if (!isClinicTestResultEditable(result.status)) {
      throw new BadRequestException(
        `Clinic test result status ${result.status} is not editable`,
      );
    }

    const testTypes = await this.testTypeRepo.find({
      where: { businessId: input.businessId, isActive: true },
    });
    const normalizedCode = normalizeCatalogMatchKey(input.measurementCode);
    const matchedType = testTypes.find((row) => {
      if (
        row.code?.trim().toLowerCase() ===
        input.measurementCode.trim().toLowerCase()
      ) {
        return true;
      }
      return normalizeCatalogMatchKey(row.title) === normalizedCode;
    });
    if (!matchedType) {
      throw new BadRequestException(
        `Unknown measurement code: ${input.measurementCode}`,
      );
    }

    let measurement =
      result.measurements?.find((row) => row.testTypeId === matchedType.id) ??
      null;
    const beforeMeasurement = measurement
      ? {
          value: measurement.value ?? null,
          labComment: measurement.labComment ?? null,
        }
      : null;

    if (!measurement) {
      measurement = this.measurementRepo.create({
        resultId: result.id,
        testTypeId: matchedType.id,
        receivedAt: new Date(),
      });
    }

    measurement.value = input.value.trim();
    measurement.receivedAt = new Date();

    const encryptedMeasurement =
      await this.clinicLabPhiService.encryptMeasurementForStorage(
        business,
        measurement,
      );
    Object.assign(measurement, encryptedMeasurement);
    const savedMeasurement = await this.measurementRepo.save(measurement);

    if (input.staff) {
      await this.clinicLabPhiService.auditMeasurementPhiWrite(
        business,
        savedMeasurement,
        beforeMeasurement,
        input.staff,
      );
    }

    if (
      (CLINIC_RESULT_ENTRY_QUEUE_STATUSES as readonly string[]).includes(
        result.status,
      )
    ) {
      await this.clinicTestResultStatusService.transitionResultStatus({
        businessId: input.businessId,
        resultId: result.id,
        toStatus: 'Completed',
        employeeId: input.employeeId,
        note: `Manual entry: ${input.measurementCode} ${input.value}`,
        staff: input.staff,
      });
    }

    const refreshed = await this.resultRepo.findOne({
      where: { id: result.id },
      relations: { measurements: true },
    });

    return {
      result: refreshed ?? result,
      measurement: savedMeasurement,
    };
  }

  async listResultsForCustomer(
    businessId: string,
    customerId: string,
  ): Promise<ClinicPatientChartResultView[]> {
    await this.assertEnabled(businessId);
    await this.backfillMissingResults(businessId);

    const results = await this.resultRepo.find({
      where: { businessId, customerId },
      relations: { order: true, testType: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return results.map((result) => ({
      id: result.id,
      bookingId: result.bookingId ?? null,
      orderId: result.orderId ?? null,
      status: result.status,
      testName: result.testType?.title ?? result.order?.displayNames ?? null,
      measurementFlag: result.measurementFlag ?? null,
      completedAt: result.completedAt?.toISOString() ?? null,
      reviewedAt: result.reviewedAt?.toISOString() ?? null,
      releasedAt: result.releasedAt?.toISOString() ?? null,
      createdAt: result.createdAt.toISOString(),
    }));
  }
}
