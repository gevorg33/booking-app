import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  canAccessBookingLabRecords,
  canCreateManualLabOrder,
  resolveClinicLabAccessTier,
  resolveLabQueueEmployeeFilter,
  type ClinicLabStaffContext,
} from '../../../common/utils/clinic-lab-access.util.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { BusinessService } from '../../business/business.service.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import { ClinicSpecimen } from '../entities/clinic-specimen.entity.js';
import { ClinicTestOrder } from '../entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../entities/clinic-test-result.entity.js';
import type { ClinicLabQueueFilters } from '../order/clinic-test-order.service.js';
import type { ClinicResultListFilters } from '../test-result/clinic-test-result.service.js';
import type { ClinicSpecimenListFilters } from '../specimen/clinic-specimen.service.js';
import type { BookingPhiAccessTarget } from '../../../common/utils/phi-minimum-access.util.js';
import {
  isLegacyPatientTestResultViewId,
  parseLegacyPatientTestResultViewId,
} from '../../../common/utils/clinic-legacy-patient-test-results-bridge.util.js';

export interface ClinicLabAccessContext {
  ctx: ClinicLabStaffContext;
  bookingAccess: BookingPhiAccessTarget | null;
}

@Injectable()
export class ClinicLabAccessService {
  constructor(
    private readonly businessService: BusinessService,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(ClinicSpecimen)
    private readonly specimenRepo: Repository<ClinicSpecimen>,
    @InjectRepository(ClinicTestResult)
    private readonly resultRepo: Repository<ClinicTestResult>,
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
  ) {}

  async resolveStaffContext(
    businessId: string,
    userId: string,
  ): Promise<ClinicLabStaffContext> {
    const membership = await this.businessService.ensureMember(
      businessId,
      userId,
    );
    const employee = await this.employeeRepo.findOne({
      where: { businessId, userId, isActive: true },
    });
    return {
      userId,
      membershipRole: membership.role,
      employeeId: employee?.id ?? null,
    };
  }

  async assertBookingLabAccess(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<ClinicLabStaffContext> {
    const access = await this.assertBookingLabAccessContext(
      businessId,
      userId,
      bookingId,
    );
    return access.ctx;
  }

  async assertBookingLabAccessContext(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<
    ClinicLabAccessContext & {
      bookingAccess: BookingPhiAccessTarget;
      bookingMetadata: Record<string, unknown> | null;
      customerId: string;
    }
  > {
    const ctx = await this.resolveStaffContext(businessId, userId);
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      select: {
        id: true,
        employeeId: true,
        linkedEmployeeIds: true,
        metadata: true,
        customerId: true,
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const bookingAccess: BookingPhiAccessTarget = booking;
    if (!canAccessBookingLabRecords(ctx, bookingAccess)) {
      throw new ForbiddenException(
        'You do not have access to lab records for this booking',
      );
    }
    return {
      ctx,
      bookingAccess,
      bookingMetadata:
        (booking.metadata as Record<string, unknown> | null | undefined) ??
        null,
      customerId: booking.customerId,
    };
  }

  async assertCanCreateManualLabOrder(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<ClinicLabStaffContext> {
    const ctx = await this.resolveStaffContext(businessId, userId);
    const booking = await this.loadBookingAccessTarget(businessId, bookingId);
    if (!canCreateManualLabOrder(ctx, booking)) {
      throw new ForbiddenException(
        'You do not have permission to create lab orders for this booking',
      );
    }
    return ctx;
  }

  async scopeLabQueueFilters(
    businessId: string,
    userId: string,
    filters: ClinicLabQueueFilters = {},
  ): Promise<ClinicLabQueueFilters> {
    const ctx = await this.resolveStaffContext(businessId, userId);
    const scopedEmployeeId = resolveLabQueueEmployeeFilter(ctx);
    if (!scopedEmployeeId) return filters;
    return { ...filters, employeeId: scopedEmployeeId };
  }

  async scopeSpecimenListFilters(
    businessId: string,
    userId: string,
    filters: ClinicSpecimenListFilters = {},
  ): Promise<ClinicSpecimenListFilters> {
    const ctx = await this.resolveStaffContext(businessId, userId);
    const scopedEmployeeId = resolveLabQueueEmployeeFilter(ctx);
    if (!scopedEmployeeId) return filters;
    return { ...filters, employeeId: scopedEmployeeId };
  }

  async scopeResultListFilters(
    businessId: string,
    userId: string,
    filters: ClinicResultListFilters = {},
  ): Promise<ClinicResultListFilters> {
    const ctx = await this.resolveStaffContext(businessId, userId);
    const scopedEmployeeId = resolveLabQueueEmployeeFilter(ctx);
    if (!scopedEmployeeId) return filters;
    return { ...filters, employeeId: scopedEmployeeId };
  }

  async resolveResultDetailAccess(
    businessId: string,
    userId: string,
    resultId: string,
  ): Promise<
    ClinicLabAccessContext & {
      bookingAccess: BookingPhiAccessTarget;
      bookingMetadata: Record<string, unknown> | null;
      customerId: string;
    }
  > {
    if (isLegacyPatientTestResultViewId(resultId)) {
      const parsed = parseLegacyPatientTestResultViewId(resultId);
      if (!parsed) {
        throw new NotFoundException('Clinic test result not found');
      }
      return this.assertBookingLabAccessContext(
        businessId,
        userId,
        parsed.bookingId,
      );
    }

    const access = await this.assertResultLabAccess(
      businessId,
      userId,
      resultId,
    );
    if (!access.bookingAccess) {
      throw new ForbiddenException(
        'Result detail requires a booking-linked lab result',
      );
    }

    const result = await this.resultRepo.findOne({
      where: { id: resultId, businessId },
      select: { id: true, bookingId: true },
    });
    if (!result?.bookingId) {
      throw new NotFoundException('Clinic test result not found');
    }

    return this.assertBookingLabAccessContext(
      businessId,
      userId,
      result.bookingId,
    );
  }

  async assertResultLabAccess(
    businessId: string,
    userId: string,
    resultId: string,
  ): Promise<ClinicLabAccessContext> {
    const result = await this.resultRepo.findOne({
      where: { id: resultId, businessId },
      select: { id: true, bookingId: true },
    });
    if (!result) {
      throw new NotFoundException('Clinic test result not found');
    }
    if (!result.bookingId) {
      const ctx = await this.resolveStaffContext(businessId, userId);
      if (resolveClinicLabAccessTier(ctx) === 'provider') {
        throw new ForbiddenException(
          'You do not have access to lab records for this result',
        );
      }
      return { ctx, bookingAccess: null };
    }
    const ctx = await this.assertBookingLabAccess(
      businessId,
      userId,
      result.bookingId,
    );
    return {
      ctx,
      bookingAccess: await this.loadBookingAccessTarget(
        businessId,
        result.bookingId,
      ),
    };
  }

  async assertOrderLabAccess(
    businessId: string,
    userId: string,
    orderId: string,
  ): Promise<ClinicLabAccessContext> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
      select: { id: true, bookingId: true },
    });
    if (!order) {
      throw new NotFoundException('Clinic test order not found');
    }
    if (!order.bookingId) {
      const ctx = await this.resolveStaffContext(businessId, userId);
      if (resolveClinicLabAccessTier(ctx) === 'provider') {
        throw new ForbiddenException(
          'You do not have access to lab records for this order',
        );
      }
      return { ctx, bookingAccess: null };
    }
    const ctx = await this.assertBookingLabAccess(
      businessId,
      userId,
      order.bookingId,
    );
    return {
      ctx,
      bookingAccess: await this.loadBookingAccessTarget(
        businessId,
        order.bookingId,
      ),
    };
  }

  async assertBookingLabChangeHistoryAccess(
    businessId: string,
    userId: string,
    bookingId: string,
  ): Promise<ClinicLabAccessContext> {
    const ctx = await this.assertBookingLabAccess(
      businessId,
      userId,
      bookingId,
    );
    return {
      ctx,
      bookingAccess: await this.loadBookingAccessTarget(businessId, bookingId),
    };
  }

  async assertSpecimenLabAccess(
    businessId: string,
    userId: string,
    specimenId: string,
  ): Promise<ClinicLabStaffContext> {
    const specimen = await this.specimenRepo.findOne({
      where: { id: specimenId, businessId },
      select: { id: true, bookingId: true },
    });
    if (!specimen) {
      throw new NotFoundException('Clinic specimen not found');
    }
    if (!specimen.bookingId) {
      const ctx = await this.resolveStaffContext(businessId, userId);
      if (resolveClinicLabAccessTier(ctx) === 'provider') {
        throw new ForbiddenException(
          'You do not have access to lab records for this specimen',
        );
      }
      return ctx;
    }
    return this.assertBookingLabAccess(businessId, userId, specimen.bookingId);
  }

  private async loadBookingAccessTarget(businessId: string, bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, businessId },
      select: { id: true, employeeId: true, linkedEmployeeIds: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
}
