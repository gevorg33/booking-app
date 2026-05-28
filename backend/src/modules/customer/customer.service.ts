import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { Booking, BookingStatus, PaymentStatus } from '../booking/entities/booking.entity.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto.js';
import {
  GetCustomersQueryDto,
  parseBookingStatusFilter,
} from './dto/get-customers-query.dto.js';
import {
  sanitizeCustomerTags,
  isCustomerTag,
} from './customer-tag.constants.js';

export interface CustomerBookingStats {
  total: number;
  byStatus: Record<string, number>;
  lastBookingAt: string | null;
  upcomingCount: number;
  noShowCount: number;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  isVip: boolean;
  segment: string;
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

export interface CustomerAppointmentItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  service: { id: string; name: string } | null;
  employee: { id: string; name: string } | null;
}

export interface CustomerDetailResult {
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    tags: string[];
    isVip: boolean;
    segment: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: CustomerBookingStats;
  appointments: CustomerAppointmentItem[];
}

export interface CustomersSearchResult {
  stats: CustomersDashboardStats;
  customers: CustomerListItem[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export type CustomerInsightMetric =
  | 'most_no_shows'
  | 'most_bookings'
  | 'most_cancellations'
  | 'at_risk'
  | 'high_no_show'
  | 'vip'
  | 'top_spenders'
  | 'new_customers'
  | 'overview';

export interface CustomerInsightRow {
  id: string;
  name: string;
  segment: string;
  stats: CustomerBookingStats;
  paidTotal?: number;
  paidCount?: number;
  currency?: string;
}

export interface CustomerInsightsResult {
  metric: CustomerInsightMetric;
  rows: CustomerInsightRow[];
  summary: {
    totalCustomers: number;
    totalNoShows: number;
    atRiskCount: number;
    highNoShowCount: number;
    vipCount: number;
  };
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
      const segment = this.computeSegment(c, stats);
      return {
        id: c.id,
        name: c.name,
        email: c.email ?? null,
        phone: c.phone ?? null,
        tags: c.tags ?? [],
        isVip: c.isVip ?? false,
        segment,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        stats,
      };
    });

    const filtered = this.applySegmentFilter(list, query);

    const totalCustomers = await this.customerRepo.count({
      where: { businessId, isActive: true },
    });

    return {
      stats: {
        totalCustomers,
        filteredCustomers: filtered.length,
        totalAppointments,
        appointmentsByStatus,
      },
      customers: filtered,
      totalItems: query.segment || query.isVip !== undefined ? filtered.length : totalItems,
      page,
      pageSize,
    };
  }

  computeSegment(
    customer: Customer,
    stats: CustomerBookingStats,
  ): 'vip' | 'at_risk' | 'high_no_show' | 'regular' | 'new' {
    const completed = stats.byStatus[BookingStatus.COMPLETED] ?? 0;
    const tags = (customer.tags ?? []).map((t) => t.toLowerCase());
    if (customer.isVip || tags.includes('vip') || completed >= 5) return 'vip';
    if (stats.total === 0) return 'new';
    const noShowRate = stats.total > 0 ? stats.noShowCount / stats.total : 0;
    if (stats.noShowCount >= 2 && noShowRate > 0.2) return 'high_no_show';
    if (stats.lastBookingAt) {
      const daysSince =
        (Date.now() - new Date(stats.lastBookingAt).getTime()) / 86400000;
      if (daysSince > 90 && completed > 0) return 'at_risk';
    }
    return 'regular';
  }

  private applySegmentFilter(
    list: CustomerListItem[],
    query: GetCustomersQueryDto,
  ): CustomerListItem[] {
    let result = list;
    if (query.tags?.trim()) {
      const tag = query.tags.trim().toLowerCase();
      if (isCustomerTag(tag)) {
        result = result.filter((c) => c.tags.map((x) => x.toLowerCase()).includes(tag));
      }
    }
    if (query.isVip === true) result = result.filter((c) => c.isVip || c.segment === 'vip');
    if (query.segment) result = result.filter((c) => c.segment === query.segment);
    return result;
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
    if (query.isVip === true) {
      qb.andWhere('(customer.isVip = true OR customer.tags LIKE :vipTag)', { vipTag: '%vip%' });
    }
    if (query.tags?.trim()) {
      const tag = query.tags.trim().toLowerCase();
      if (isCustomerTag(tag)) {
        qb.andWhere(
          '(customer.tags = :tag OR customer.tags LIKE :tagPrefix OR customer.tags LIKE :tagSuffix OR customer.tags LIKE :tagMiddle)',
          {
            tag,
            tagPrefix: `${tag},%`,
            tagSuffix: `%,${tag}`,
            tagMiddle: `%,${tag},%`,
          },
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
      noShowCount: 0,
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
      if (row.status === BookingStatus.NO_SHOW) {
        entry.noShowCount += count;
      }
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

  async getCustomerDetail(businessId: string, customerId: string): Promise<CustomerDetailResult> {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, businessId, isActive: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const statsMap = await this.loadBookingStatsMap(businessId, [customerId]);
    const stats = statsMap.get(customerId) ?? this.emptyStats();

    const bookings = await this.bookingRepo.find({
      where: { businessId, customerId },
      relations: { service: true, employee: true },
      order: { startTime: 'DESC' },
      take: 100,
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        tags: customer.tags ?? [],
        isVip: customer.isVip ?? false,
        segment: this.computeSegment(customer, stats),
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
      stats,
      appointments: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        paymentStatus: b.paymentStatus,
        notes: b.notes ?? null,
        service: b.service ? { id: b.service.id, name: b.service.name } : null,
        employee: b.employee ? { id: b.employee.id, name: b.employee.name } : null,
      })),
    };
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.tags !== undefined) {
      customer.tags = sanitizeCustomerTags(dto.tags);
      customer.isVip = customer.tags.includes('vip');
    } else if (dto.isVip !== undefined) {
      customer.isVip = dto.isVip;
      const tags = sanitizeCustomerTags(customer.tags);
      if (dto.isVip && !tags.includes('vip')) {
        customer.tags = ['vip', ...tags.filter((t) => t !== 'vip')];
      } else if (!dto.isVip) {
        customer.tags = tags.filter((t) => t !== 'vip');
      }
    }
    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.email !== undefined) customer.email = dto.email;
    if (dto.phone !== undefined) customer.phone = dto.phone;
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
        const saved = await this.applyNotificationPreferences(byEmail, dto);
        return { customer: saved, created: false };
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
        const saved = await this.applyNotificationPreferences(byPhone, dto);
        return { customer: saved, created: false };
      }
    }

    const customer = await this.create(businessId, {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
    });

    const saved = await this.applyNotificationPreferences(customer, dto);
    return { customer: saved, created: true };
  }

  private async applyNotificationPreferences(
    customer: Customer,
    dto: CreateCustomerDto,
  ): Promise<Customer> {
    if (
      dto.emailReminders === undefined &&
      dto.smsReminders === undefined &&
      dto.whatsappReminders === undefined
    ) {
      return customer;
    }
    const existing = (customer.metadata?.notifications ?? {}) as Record<string, boolean>;
    customer.metadata = {
      ...customer.metadata,
      notifications: {
        emailReminders: dto.emailReminders ?? existing.emailReminders ?? true,
        smsReminders: dto.smsReminders ?? existing.smsReminders ?? false,
        whatsappReminders: dto.whatsappReminders ?? existing.whatsappReminders ?? true,
      },
    };
    return this.customerRepo.save(customer);
  }

  async getCustomerInsights(
    businessId: string,
    metric: CustomerInsightMetric,
    limit = 5,
  ): Promise<CustomerInsightsResult> {
    const customers = await this.customerRepo.find({
      where: { businessId, isActive: true },
      order: { name: 'ASC' },
    });
    const statsMap = await this.loadBookingStatsMap(
      businessId,
      customers.map((c) => c.id),
    );

    const enriched: CustomerInsightRow[] = customers.map((c) => {
      const stats = statsMap.get(c.id) ?? this.emptyStats();
      return {
        id: c.id,
        name: c.name,
        segment: this.computeSegment(c, stats),
        stats,
      };
    });

    const summary = {
      totalCustomers: enriched.length,
      totalNoShows: enriched.reduce((n, r) => n + r.stats.noShowCount, 0),
      atRiskCount: enriched.filter((r) => r.segment === 'at_risk').length,
      highNoShowCount: enriched.filter((r) => r.segment === 'high_no_show').length,
      vipCount: enriched.filter((r) => r.segment === 'vip').length,
    };

    const cap = Math.min(Math.max(limit, 1), 20);
    let rows: CustomerInsightRow[] = [];

    switch (metric) {
      case 'most_no_shows':
        rows = [...enriched]
          .filter((r) => r.stats.noShowCount > 0)
          .sort((a, b) => b.stats.noShowCount - a.stats.noShowCount);
        break;
      case 'most_bookings':
        rows = [...enriched]
          .filter((r) => r.stats.total > 0)
          .sort((a, b) => b.stats.total - a.stats.total);
        break;
      case 'most_cancellations':
        rows = [...enriched]
          .filter((r) => (r.stats.byStatus[BookingStatus.CANCELLED] ?? 0) > 0)
          .sort(
            (a, b) =>
              (b.stats.byStatus[BookingStatus.CANCELLED] ?? 0) -
              (a.stats.byStatus[BookingStatus.CANCELLED] ?? 0),
          );
        break;
      case 'at_risk':
        rows = enriched.filter((r) => r.segment === 'at_risk');
        break;
      case 'high_no_show':
        rows = enriched.filter((r) => r.segment === 'high_no_show');
        break;
      case 'vip':
        rows = enriched.filter((r) => r.segment === 'vip');
        break;
      case 'new_customers':
        rows = enriched.filter((r) => r.segment === 'new');
        break;
      case 'top_spenders': {
        const paidRows = await this.bookingRepo
          .createQueryBuilder('booking')
          .innerJoin('booking.service', 'service')
          .innerJoin('booking.customer', 'customer')
          .select('booking.customer_id', 'customerId')
          .addSelect('customer.name', 'customerName')
          .addSelect('COUNT(*)', 'paidCount')
          .addSelect('SUM(service.price)', 'paidTotal')
          .addSelect('MAX(service.currency)', 'currency')
          .where('booking.business_id = :businessId', { businessId })
          .andWhere('booking.paymentStatus = :paid', { paid: PaymentStatus.PAID })
          .andWhere('booking.customer_id IS NOT NULL')
          .groupBy('booking.customer_id')
          .addGroupBy('customer.name')
          .orderBy('SUM(service.price)', 'DESC')
          .limit(cap)
          .getRawMany<{
            customerId: string;
            customerName: string;
            paidCount: string;
            paidTotal: string;
            currency: string | null;
          }>();

        rows = paidRows.map((r) => {
          const match = enriched.find((e) => e.id === r.customerId);
          return {
            id: r.customerId,
            name: r.customerName,
            segment: match?.segment ?? 'regular',
            stats: match?.stats ?? this.emptyStats(),
            paidTotal: Math.round(Number(r.paidTotal) * 100) / 100,
            paidCount: parseInt(r.paidCount, 10),
            currency: r.currency || 'USD',
          };
        });
        break;
      }
      case 'overview':
      default:
        rows = [...enriched]
          .filter((r) => r.stats.noShowCount > 0)
          .sort((a, b) => b.stats.noShowCount - a.stats.noShowCount);
        break;
    }

    return {
      metric,
      rows: rows.slice(0, cap),
      summary,
    };
  }
}
