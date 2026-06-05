import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { CommissionRule } from '../commissions/entities/commission-rule.entity.js';
import {
  formatBusinessMoney,
  getBusinessDefaultCurrency,
} from '../../common/utils/business-currency.util.js';
import {
  resolveBookingPaidGrossAmount,
  resolveBookingTaxCollected,
  resolveBookingNetRevenue,
  sumBookingTaxRevenue,
} from '../../common/utils/booking-receipt-tax.util.js';
import {
  AnalyticsQueryDto,
  parseDateRange,
} from './dto/analytics-query.dto.js';

export interface StaffPerformanceRow {
  employeeId: string;
  employeeName: string;
  bookings: number;
  completed: number;
  noShows: number;
  revenue: number;
  hoursBooked: number;
  utilizationPercent: number;
}

export interface ServicePopularityRow {
  serviceId: string;
  serviceName: string;
  bookings: number;
  revenue: number;
}

export interface HeatmapCell {
  dayOfWeek: number;
  hour: number;
  count: number;
}

export interface PlReport {
  revenue: number;
  grossRevenue: number;
  taxCollected: number;
  netRevenue: number;
  expenses: number;
  commissions: number;
  netProfit: number;
  currency: string;
  period: { from: string; to: string };
}

export interface StaffPerformanceReport {
  currency: string;
  rows: StaffPerformanceRow[];
}

export interface ServicePopularityReport {
  currency: string;
  rows: ServicePopularityRow[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(CommissionRule)
    private commissionRepo: Repository<CommissionRule>,
  ) {}

  private async resolveBusinessSettings(
    businessId: string,
  ): Promise<Record<string, unknown>> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    return (business.settings ?? {}) as Record<string, unknown>;
  }

  async staffPerformance(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<StaffPerformanceReport> {
    const settings = await this.resolveBusinessSettings(businessId);
    const rows = await this.computeStaffPerformance(businessId, query);
    return {
      currency: getBusinessDefaultCurrency(settings),
      rows,
    };
  }

  async servicePopularity(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<ServicePopularityReport> {
    const settings = await this.resolveBusinessSettings(businessId);
    const rows = await this.computeServicePopularity(businessId, query);
    return {
      currency: getBusinessDefaultCurrency(settings),
      rows,
    };
  }

  async heatmap(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<HeatmapCell[]> {
    const { start, end } = parseDateRange(query.from, query.to);
    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(start, end),
        status: Not(
          In([BookingStatus.CANCELLED, BookingStatus.NO_SHOW]),
        ) as any,
      },
    });

    const grid = new Map<string, number>();
    for (const b of bookings) {
      const d = new Date(b.startTime);
      const key = `${d.getUTCDay()}-${d.getUTCHours()}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    }

    const cells: HeatmapCell[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        cells.push({
          dayOfWeek: day,
          hour,
          count: grid.get(`${day}-${hour}`) ?? 0,
        });
      }
    }
    return cells;
  }

  async profitAndLoss(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<PlReport> {
    const settings = await this.resolveBusinessSettings(businessId);
    const { start, end } = parseDateRange(query.from, query.to);
    const staff = await this.computeStaffPerformance(businessId, query);
    const revenue = staff.reduce((s, r) => s + r.revenue, 0);
    const taxTotals = await this.computeTaxRevenueTotals(businessId, query);

    const expenseQb = this.expenseRepo
      .createQueryBuilder('e')
      .where('e.business_id = :businessId', { businessId })
      .andWhere('e.expenseDate BETWEEN :from AND :to', {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
      });
    if (query.locationId)
      expenseQb.andWhere('e.location_id = :locationId', {
        locationId: query.locationId,
      });
    const expenses = await expenseQb.getMany();
    const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const commissions = await this.computeCommissions(
      businessId,
      start,
      end,
      query.locationId,
    );
    const netProfit = revenue - expenseTotal - commissions;

    return {
      revenue: Math.round(revenue * 100) / 100,
      grossRevenue: taxTotals.grossRevenue,
      taxCollected: taxTotals.taxCollected,
      netRevenue: taxTotals.netRevenue,
      expenses: Math.round(expenseTotal * 100) / 100,
      commissions: Math.round(commissions * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      currency: getBusinessDefaultCurrency(settings),
      period: { from: start.toISOString(), to: end.toISOString() },
    };
  }

  private async computeTaxRevenueTotals(
    businessId: string,
    query: AnalyticsQueryDto,
  ) {
    const { start, end } = parseDateRange(query.from, query.to);
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.service', 'service')
      .where('b.business_id = :businessId', { businessId })
      .andWhere('b.startTime BETWEEN :start AND :end', { start, end })
      .andWhere('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.paymentStatus = :paid', { paid: PaymentStatus.PAID });

    if (query.employeeId) {
      qb.andWhere('b.employee_id = :employeeId', {
        employeeId: query.employeeId,
      });
    }
    if (query.locationId) {
      qb.andWhere('b.location_id = :locationId', {
        locationId: query.locationId,
      });
    }

    const bookings = await qb.getMany();
    return sumBookingTaxRevenue(
      bookings.map((booking) => ({
        service: booking.service,
        metadata: booking.metadata as Record<string, unknown> | null,
      })),
    );
  }

  private async computeStaffPerformance(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<StaffPerformanceRow[]> {
    const { start, end } = parseDateRange(query.from, query.to);
    const employees = await this.employeeRepo.find({
      where: { businessId, isActive: true },
    });
    const employeeMap = new Map(employees.map((e) => [e.id, e.name]));

    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.service', 'service')
      .where('b.business_id = :businessId', { businessId })
      .andWhere('b.startTime BETWEEN :start AND :end', { start, end });

    if (query.employeeId)
      qb.andWhere('b.employee_id = :employeeId', {
        employeeId: query.employeeId,
      });
    if (query.locationId)
      qb.andWhere('b.location_id = :locationId', {
        locationId: query.locationId,
      });

    const bookings = await qb.getMany();
    const byEmployee = new Map<string, StaffPerformanceRow>();

    for (const [id, name] of employeeMap) {
      byEmployee.set(id, {
        employeeId: id,
        employeeName: name,
        bookings: 0,
        completed: 0,
        noShows: 0,
        revenue: 0,
        hoursBooked: 0,
        utilizationPercent: 0,
      });
    }

    for (const b of bookings) {
      if (b.status === BookingStatus.CANCELLED) continue;
      const row = byEmployee.get(b.employeeId);
      if (!row) continue;
      row.bookings += 1;
      if (b.status === BookingStatus.COMPLETED) row.completed += 1;
      if (b.status === BookingStatus.NO_SHOW) row.noShows += 1;
      if (b.paymentStatus === PaymentStatus.PAID && b.service) {
        row.revenue += resolveBookingPaidGrossAmount({
          service: b.service,
          metadata: b.metadata as Record<string, unknown> | null,
        });
      }
      row.hoursBooked +=
        (b.endTime.getTime() - b.startTime.getTime()) / 3600000;
    }

    const periodDays = Math.max(
      1,
      (end.getTime() - start.getTime()) / 86400000,
    );
    const capacityHours = periodDays * 8;

    for (const row of byEmployee.values()) {
      row.revenue = Math.round(row.revenue * 100) / 100;
      row.hoursBooked = Math.round(row.hoursBooked * 10) / 10;
      row.utilizationPercent = Math.min(
        100,
        Math.round((row.hoursBooked / capacityHours) * 100),
      );
    }

    return Array.from(byEmployee.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );
  }

  private async computeServicePopularity(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<ServicePopularityRow[]> {
    const { start, end } = parseDateRange(query.from, query.to);
    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(start, end),
        status: Not(In([BookingStatus.CANCELLED])) as any,
      },
      relations: { service: true },
    });

    const map = new Map<string, ServicePopularityRow>();
    for (const b of bookings) {
      if (!b.service) continue;
      let row = map.get(b.serviceId);
      if (!row) {
        row = {
          serviceId: b.serviceId,
          serviceName: b.service.name,
          bookings: 0,
          revenue: 0,
        };
        map.set(b.serviceId, row);
      }
      row.bookings += 1;
      if (b.paymentStatus === PaymentStatus.PAID) {
        row.revenue += resolveBookingPaidGrossAmount({
          service: b.service,
          metadata: b.metadata as Record<string, unknown> | null,
        });
      }
    }

    return Array.from(map.values())
      .map((r) => ({ ...r, revenue: Math.round(r.revenue * 100) / 100 }))
      .sort((a, b) => b.bookings - a.bookings);
  }

  private async computeCommissions(
    businessId: string,
    start: Date,
    end: Date,
    locationId?: string,
  ): Promise<number> {
    const rules = await this.commissionRepo.find({
      where: { businessId, isActive: true },
    });
    if (rules.length === 0) return 0;

    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.service', 'service')
      .where('b.business_id = :businessId', { businessId })
      .andWhere('b.startTime BETWEEN :start AND :end', { start, end })
      .andWhere('b.status = :status', { status: BookingStatus.COMPLETED })
      .andWhere('b.paymentStatus = :paid', { paid: PaymentStatus.PAID });

    if (locationId) qb.andWhere('b.location_id = :locationId', { locationId });
    const bookings = await qb.getMany();

    let total = 0;
    for (const b of bookings) {
      if (!b.service) continue;
      const price = resolveBookingPaidGrossAmount({
        service: b.service,
        metadata: b.metadata as Record<string, unknown> | null,
      });
      const rule =
        rules.find(
          (r) => r.employeeId === b.employeeId && r.serviceId === b.serviceId,
        ) ??
        rules.find((r) => r.employeeId === b.employeeId && !r.serviceId) ??
        rules.find((r) => !r.employeeId && r.serviceId === b.serviceId) ??
        rules.find((r) => !r.employeeId && !r.serviceId);
      if (!rule) continue;
      total +=
        rule.type === 'percent'
          ? (price * Number(rule.value)) / 100
          : Number(rule.value);
    }
    return total;
  }

  exportCsv(businessId: string, query: AnalyticsQueryDto): Promise<string> {
    return this.buildExportRows(businessId, query).then((rows) => {
      const header = 'Section,Key,Value1,Value2,Value3';
      return [header, ...rows].join('\n');
    });
  }

  exportPdfHtml(businessId: string, query: AnalyticsQueryDto): Promise<string> {
    return Promise.all([
      this.staffPerformance(businessId, query),
      this.servicePopularity(businessId, query),
      this.profitAndLoss(businessId, query),
      this.resolveBusinessSettings(businessId),
    ]).then(([staffReport, serviceReport, pl, settings]) => {
      const fmt = (amount: number) => formatBusinessMoney(amount, settings);
      const staffRows = staffReport.rows
        .map(
          (s) =>
            `<tr><td>${s.employeeName}</td><td>${s.bookings}</td><td>${fmt(s.revenue)}</td><td>${s.utilizationPercent}%</td></tr>`,
        )
        .join('');
      const serviceRows = serviceReport.rows
        .map(
          (s) =>
            `<tr><td>${s.serviceName}</td><td>${s.bookings}</td><td>${fmt(s.revenue)}</td></tr>`,
        )
        .join('');
      const currencyLabel = pl.currency;
      return `<!DOCTYPE html><html><head><title>Report</title><style>
        body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%;margin:16px 0}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}
        @media print{button{display:none}}
      </style></head><body>
        <h1>Business Report</h1>
        <p>${pl.period.from.slice(0, 10)} — ${pl.period.to.slice(0, 10)}</p>
        <p><em>All amounts in ${currencyLabel}. No currency conversion applied.</em></p>
        <h2>P&amp;L Summary (${currencyLabel})</h2>
        <p>Gross revenue: ${fmt(pl.grossRevenue)} | Tax collected: ${fmt(pl.taxCollected)} | Net revenue: ${fmt(pl.netRevenue)} | Expenses: ${fmt(pl.expenses)} | Commissions: ${fmt(pl.commissions)} | Net profit: ${fmt(pl.netProfit)}</p>
        <h2>Staff Performance</h2>
        <table><tr><th>Staff</th><th>Bookings</th><th>Revenue (${currencyLabel})</th><th>Utilization</th></tr>${staffRows}</table>
        <h2>Service Popularity</h2>
        <table><tr><th>Service</th><th>Bookings</th><th>Revenue (${currencyLabel})</th></tr>${serviceRows}</table>
        <button onclick="window.print()">Print / Save as PDF</button>
      </body></html>`;
    });
  }

  private async buildExportRows(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<string[]> {
    const [staffReport, serviceReport, pl] = await Promise.all([
      this.staffPerformance(businessId, query),
      this.servicePopularity(businessId, query),
      this.profitAndLoss(businessId, query),
    ]);
    const rows: string[] = [];
    rows.push(`Meta,Currency,${pl.currency},,`);
    rows.push(`P&L,Gross Revenue,${pl.grossRevenue},,`);
    rows.push(`P&L,Tax Collected,${pl.taxCollected},,`);
    rows.push(`P&L,Net Revenue,${pl.netRevenue},,`);
    rows.push(`P&L,Revenue,${pl.revenue},,`);
    rows.push(`P&L,Expenses,${pl.expenses},,`);
    rows.push(`P&L,Commissions,${pl.commissions},,`);
    rows.push(`P&L,Net Profit,${pl.netProfit},,`);
    for (const s of staffReport.rows) {
      rows.push(
        `Staff,${this.csvEscape(s.employeeName)},${s.bookings},${s.revenue},${s.utilizationPercent}`,
      );
    }
    for (const s of serviceReport.rows) {
      rows.push(
        `Service,${this.csvEscape(s.serviceName)},${s.bookings},${s.revenue},`,
      );
    }
    return rows;
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
