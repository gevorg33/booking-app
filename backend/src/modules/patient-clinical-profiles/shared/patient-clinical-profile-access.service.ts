import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  canAccessCustomerClinicalChart,
  type CustomerClinicalPhiAccessContext,
} from '../../../common/utils/clinic-chart-access.util.js';
import type { ClinicLabStaffContext } from '../../../common/utils/clinic-lab-access.util.js';
import { Booking } from '../../booking/entities/booking.entity.js';
import { BusinessService } from '../../business/business.service.js';
import { Customer } from '../../customer/entities/customer.entity.js';
import { Employee } from '../../employee/entities/employee.entity.js';
import type { PhiStaffContext } from '../../compliance/phi-field.service.js';

export interface PatientClinicalProfileAccessContext {
  ctx: ClinicLabStaffContext;
  phiAccess: CustomerClinicalPhiAccessContext;
}

@Injectable()
export class PatientClinicalProfileAccessService {
  constructor(
    private readonly businessService: BusinessService,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
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

  private async customerHasAssignedBooking(
    businessId: string,
    customerId: string,
    employeeId: string,
  ): Promise<boolean> {
    const bookings = await this.bookingRepo.find({
      where: { businessId, customerId },
      select: { employeeId: true, linkedEmployeeIds: true },
      take: 100,
    });
    return bookings.some(
      (booking) =>
        booking.employeeId === employeeId ||
        (booking.linkedEmployeeIds ?? []).includes(employeeId),
    );
  }

  async assertCustomerClinicalProfileAccess(
    businessId: string,
    userId: string,
    customerId: string,
  ): Promise<PatientClinicalProfileAccessContext> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const ctx = await this.resolveStaffContext(businessId, userId);
    const hasAssignedBooking = ctx.employeeId
      ? await this.customerHasAssignedBooking(
          businessId,
          customerId,
          ctx.employeeId,
        )
      : false;
    const phiAccess: CustomerClinicalPhiAccessContext = {
      hasAssignedBooking,
    };

    if (!canAccessCustomerClinicalChart(ctx, phiAccess)) {
      throw new ForbiddenException(
        'You do not have access to this patient clinical profile',
      );
    }

    return { ctx, phiAccess };
  }

  toPhiStaffContext(ctx: ClinicLabStaffContext): PhiStaffContext {
    return {
      userId: ctx.userId,
      role: String(ctx.membershipRole),
      employeeId: ctx.employeeId,
    };
  }
}
