import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto.js';
import {
  GetCustomersQueryDto,
  parseBookingStatusFilter,
} from './dto/get-customers-query.dto.js';

export interface CustomerBookingStats {
  total: number;
  byStatus: Record<string, number>;
  lastBookingAt: string | null;
  upcomingCount: number;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  stats: CustomerBookingStats;
}

export interface CustomersDashboardStats {
  totalCustomers: number;
  filteredCustomers: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
}

export interface CustomersSearchResult {
  stats: CustomersDashboardStats;
  customers: CustomerListItem[];
  totalItems: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
  ) {}

  async create(businessId: string, dto: CreateCustomerDto): Promise<Customer> {
    return this.customerRepo.save(this.customerRepo.create({ ...dto, businessId }));
  }

  async findAll(businessId: string): Promise<Customer[]> {
    return this.customerRepo.find({ where: { businessId, isActive: true }, order: { name: 'ASC' } });
  }

  async searchDashboard(
    businessId: string,
    query: GetCustomersQueryDto,
  ): Promise<CustomersSearchResult> {
    const statuses = parseBookingStatusFilter(query.bookingStatus);
    const sortBy =
      query.sortBy === 'updatedAt'
        ? 'updatedAt'
        : query.sortBy === 'name'
          ? 'name'
          : 'createdAt';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize =
      query.pageSize && query.pageSize > 0 ? Math.min(query.pageSize, 100) : 20;
    const skip = (page - 1) * pageSize;

    const qb = this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.business_id = :businessId', { businessId })
      .andWhere('customer.isActive = :isActive', { isActive: true });

    this.applyCustomerFilters(qb, query);

    if (statuses.length > 0) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.customer_id = customer.id
            AND b.business_id = :businessId
            AND b.status IN (:...statuses)
        )`,
        { businessId, statuses },
      );
    }

    if (sortBy === 'name') {
      qb.orderBy('LOWER(customer.name)', sortOrder);
    } else {
      qb.orderBy(`customer.${sortBy}`, sortOrder);
    }

    const totalItems = await qb.getCount();
    const customers = await qb.skip(skip).take(pageSize).getMany();
    const customerIds = customers.map((c) => c.id);
    const statsMap = await this.loadBookingStatsMap(businessId, customerIds);

    const appointmentsByStatus: Record<string, number> = {};
    let totalAppointments = 0;

    const list: CustomerListItem[] = customers.map((c) => {
      const stats = statsMap.get(c.id) ?? this.emptyStats();
      totalAppointments += stats.total;
      for (const [status, count] of Object.entries(stats.byStatus)) {
        appointmentsByStatus[status] = (appointmentsByStatus[status] ?? 0) + count;
      }
      return {
        id: c.id,
        name: c.name,
        email: c.email ?? null,
        phone: c.phone ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        stats,
      };
    });

    const totalCustomers = await this.customerRepo.count({
      where: { businessId, isActive: true },
    });

    return {
      stats: {
        totalCustomers,
        filteredCustomers: totalItems,
        totalAppointments,
        appointmentsByStatus,
      },
      customers: list,
      totalItems,
      page,
      pageSize,
    };
  }

  private applyCustomerFilters(
    qb: ReturnType<Repository<Customer>['createQueryBuilder']>,
    query: GetCustomersQueryDto,
  ) {
    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        '(customer.name ILIKE :term OR customer.email ILIKE :term OR customer.phone ILIKE :term)',
        { term },
      );
    }
    if (query.email?.trim()) {
      qb.andWhere('LOWER(customer.email) LIKE :email', {
        email: `%${query.email.trim().toLowerCase()}%`,
      });
    }
    if (query.phone?.trim()) {
      const digits = query.phone.replace(/\D/g, '');
      if (digits) {
        qb.andWhere(
          "REGEXP_REPLACE(COALESCE(customer.phone, ''), '\\\\D', '', 'g') LIKE :phone",
          { phone: `%${digits}%` },
        );
      }
    }
  }

  private emptyStats(): CustomerBookingStats {
    return {
      total: 0,
      byStatus: {},
      lastBookingAt: null,
      upcomingCount: 0,
    };
  }

  private async loadBookingStatsMap(
    businessId: string,
    customerIds: string[],
  ): Promise<Map<string, CustomerBookingStats>> {
    const map = new Map<string, CustomerBookingStats>();
    if (customerIds.length === 0) return map;

    const rows = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('booking.customer_id', 'customerId')
      .addSelect('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(booking.startTime)', 'lastStart')
      .where('booking.business_id = :businessId', { businessId })
      .andWhere('booking.customer_id IN (:...customerIds)', { customerIds })
      .groupBy('booking.customer_id')
      .addGroupBy('booking.status')
      .getRawMany<{ customerId: string; status: string; count: string; lastStart: string }>();

    const now = new Date();

    for (const id of customerIds) {
      map.set(id, this.emptyStats());
    }

    for (const row of rows) {
      const entry = map.get(row.customerId)!;
      const count = parseInt(row.count, 10);
      entry.total += count;
      entry.byStatus[row.status] = count;
      const last = row.lastStart ? new Date(row.lastStart) : null;
      if (last && (!entry.lastBookingAt || last > new Date(entry.lastBookingAt))) {
        entry.lastBookingAt = last.toISOString();
      }
    }

    const upcomingRows = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('booking.customer_id', 'customerId')
      .addSelect('COUNT(*)', 'count')
      .where('booking.business_id = :businessId', { businessId })
      .andWhere('booking.customer_id IN (:...customerIds)', { customerIds })
      .andWhere('booking.startTime > :now', { now })
      .andWhere('booking.status NOT IN (:...excluded)', {
        excluded: [BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW],
      })
      .groupBy('booking.customer_id')
      .getRawMany<{ customerId: string; count: string }>();

    for (const row of upcomingRows) {
      const entry = map.get(row.customerId);
      if (entry) entry.upcomingCount = parseInt(row.count, 10);
    }

    return map;
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    await this.customerRepo.update(id, { isActive: false });
  }

  /** Normalize phone to digits-only for lookup. */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Reuse an existing tenant customer when email and/or phone matches;
   * otherwise create a new record.
   */
  async findOrCreateByContact(
    businessId: string,
    dto: CreateCustomerDto,
  ): Promise<{ customer: Customer; created: boolean }> {
    const email = dto.email ? this.normalizeEmail(dto.email) : null;
    const phone = dto.phone ? this.normalizePhone(dto.phone) : null;

    if (email) {
      const byEmail = await this.customerRepo
        .createQueryBuilder('customer')
        .where('customer.business_id = :businessId', { businessId })
        .andWhere('customer.isActive = :isActive', { isActive: true })
        .andWhere('LOWER(customer.email) = :email', { email })
        .getOne();
      if (byEmail) {
        if (phone && !byEmail.phone) {
          byEmail.phone = dto.phone!;
          await this.customerRepo.save(byEmail);
        }
        if (dto.name && byEmail.name !== dto.name) {
          byEmail.name = dto.name;
          await this.customerRepo.save(byEmail);
        }
        return { customer: byEmail, created: false };
      }
    }

    if (phone) {
      const customers = await this.customerRepo.find({
        where: { businessId, isActive: true },
      });
      const byPhone = customers.find(
        (c) => c.phone && this.normalizePhone(c.phone) === phone,
      );
      if (byPhone) {
        if (email && !byPhone.email) {
          byPhone.email = dto.email!;
          await this.customerRepo.save(byPhone);
        }
        if (dto.name && byPhone.name !== dto.name) {
          byPhone.name = dto.name;
          await this.customerRepo.save(byPhone);
        }
        return { customer: byPhone, created: false };
      }
    }

    const customer = await this.create(businessId, {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });
    return { customer, created: true };
  }
}
