import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessService } from '../business/business.service.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import {
  applyCustomerWaitlistRequestToMetadata,
  buildCustomerWaitlistRequest,
  ensureWaitlistTag,
  hasWaitlistTag,
  readCustomerWaitlistRequest,
  removeWaitlistTag,
  type CustomerWaitlistRequest,
} from '../../common/utils/customer-waitlist.util.js';
import type { PublicJoinWaitlistDto } from './dto/public-customer-waitlist.dto.js';

export interface PublicCustomerWaitlistStatus {
  onWaitlist: boolean;
  request: CustomerWaitlistRequest | null;
}

@Injectable()
export class PublicCustomerWaitlistService {
  constructor(
    private businessService: BusinessService,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
  ) {}

  async joinWaitlist(
    slug: string,
    customerId: string,
    dto: PublicJoinWaitlistDto,
  ): Promise<PublicCustomerWaitlistStatus> {
    const { customer, businessId } = await this.loadOwnedCustomer(
      slug,
      customerId,
    );
    const resolved = await this.resolveWaitlistPreferences(businessId, dto);
    const previous = readCustomerWaitlistRequest(customer.metadata);
    const request = buildCustomerWaitlistRequest({
      ...resolved,
      previous,
      status: 'active',
    });

    customer.tags = ensureWaitlistTag(customer.tags);
    customer.metadata = applyCustomerWaitlistRequestToMetadata(
      customer.metadata,
      request,
    );
    await this.customerRepo.save(customer);

    return {
      onWaitlist: true,
      request: readCustomerWaitlistRequest(customer.metadata),
    };
  }

  async getWaitlistStatus(
    slug: string,
    customerId: string,
  ): Promise<PublicCustomerWaitlistStatus> {
    const { customer } = await this.loadOwnedCustomer(slug, customerId);
    const request = readCustomerWaitlistRequest(customer.metadata);
    return {
      onWaitlist: hasWaitlistTag(customer.tags) && request?.status === 'active',
      request,
    };
  }

  async leaveWaitlist(
    slug: string,
    customerId: string,
  ): Promise<PublicCustomerWaitlistStatus> {
    const { customer } = await this.loadOwnedCustomer(slug, customerId);
    const previous = readCustomerWaitlistRequest(customer.metadata);
    customer.tags = removeWaitlistTag(customer.tags);
    if (previous) {
      customer.metadata = applyCustomerWaitlistRequestToMetadata(
        customer.metadata,
        buildCustomerWaitlistRequest({
          previous,
          status: 'cancelled',
        }),
      );
    }
    await this.customerRepo.save(customer);
    return {
      onWaitlist: false,
      request: readCustomerWaitlistRequest(customer.metadata),
    };
  }

  private async loadOwnedCustomer(slug: string, customerId: string) {
    const business = await this.businessService.findBySlug(slug);
    if (!business.isActive) throw new NotFoundException('Business not found');

    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId: business.id },
    });
    if (!customer || !customer.isActive) {
      throw new NotFoundException('Customer not found');
    }

    return { customer, businessId: business.id };
  }

  private async resolveWaitlistPreferences(
    businessId: string,
    dto: PublicJoinWaitlistDto,
  ) {
    const serviceId = dto.serviceId;
    let serviceName = dto.serviceName?.trim();
    if (serviceId) {
      const service = await this.serviceRepo.findOne({
        where: { id: serviceId, businessId },
      });
      if (!service) throw new ForbiddenException('Service not found');
      serviceName = service.name;
    }

    const employeeId = dto.employeeId;
    let employeeName = dto.employeeName?.trim();
    if (employeeId) {
      const employee = await this.employeeRepo.findOne({
        where: { id: employeeId, businessId },
      });
      if (!employee) throw new ForbiddenException('Provider not found');
      employeeName = employee.name;
    }

    return {
      ...(serviceId ? { serviceId } : {}),
      ...(serviceName ? { serviceName } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(employeeName ? { employeeName } : {}),
      ...(dto.date ? { date: dto.date } : {}),
      ...(dto.dateFrom ? { dateFrom: dto.dateFrom } : {}),
      ...(dto.dateTo ? { dateTo: dto.dateTo } : {}),
      ...(dto.timeSlot ? { timeSlot: dto.timeSlot } : {}),
      ...(dto.timeOfDay ? { timeOfDay: dto.timeOfDay } : {}),
      ...(dto.notes ? { notes: dto.notes.trim() } : {}),
    };
  }
}
