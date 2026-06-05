import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Expense } from '../expenses/entities/expense.entity.js';
import { CommissionRule } from '../commissions/entities/commission-rule.entity.js';
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
  expenses: number;
  commissions: number;
  netProfit: number;
  period: { from: string; to: string };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>,
    @InjectRepository(CommissionRule)
    private commissionRepo: Repository<CommissionRule>,
  ) {}

  async staffPerformance(
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
        row.revenue += Number(b.service.price);
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

  async servicePopularity(
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
        row.revenue += Number(b.service.price);
      }
    }

    return Array.from(map.values())
      .map((r) => ({ ...r, revenue: Math.round(r.revenue * 100) / 100 }))
      .sort((a, b) => b.bookings - a.bookings);
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
    const { start, end } = parseDateRange(query.from, query.to);
    const staff = await this.staffPerformance(businessId, query);
    const revenue = staff.reduce((s, r) => s + r.revenue, 0);

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
      expenses: Math.round(expenseTotal * 100) / 100,
      commissions: Math.round(commissions * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      period: { from: start.toISOString(), to: end.toISOString() },
    };
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
      const price = Number(b.service.price);
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
    ]).then(([staff, services, pl]) => {
      const staffRows = staff
        .map(
          (s) =>
            `<tr><td>${s.employeeName}</td><td>${s.bookings}</td><td>$${s.revenue}</td><td>${s.utilizationPercent}%</td></tr>`,
        )
        .join('');
      const serviceRows = services
        .map(
          (s) =>
            `<tr><td>${s.serviceName}</td><td>${s.bookings}</td><td>$${s.revenue}</td></tr>`,
        )
        .join('');
      return `<!DOCTYPE html><html><head><title>Report</title><style>
        body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%;margin:16px 0}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}
        @media print{button{display:none}}
      </style></head><body>
        <h1>Business Report</h1>
        <p>${pl.period.from.slice(0, 10)} — ${pl.period.to.slice(0, 10)}</p>
        <h2>P&amp;L Summary</h2>
        <p>Revenue: $${pl.revenue} | Expenses: $${pl.expenses} | Commissions: $${pl.commissions} | Net: $${pl.netProfit}</p>
        <h2>Staff Performance</h2>
        <table><tr><th>Staff</th><th>Bookings</th><th>Revenue</th><th>Utilization</th></tr>${staffRows}</table>
        <h2>Service Popularity</h2>
        <table><tr><th>Service</th><th>Bookings</th><th>Revenue</th></tr>${serviceRows}</table>
        <button onclick="window.print()">Print / Save as PDF</button>
      </body></html>`;
    });
  }

  private async buildExportRows(
    businessId: string,
    query: AnalyticsQueryDto,
  ): Promise<string[]> {
    const [staff, services, pl] = await Promise.all([
      this.staffPerformance(businessId, query),
      this.servicePopularity(businessId, query),
      this.profitAndLoss(businessId, query),
    ]);
    const rows: string[] = [];
    rows.push(`P&L,Revenue,${pl.revenue},,`);
    rows.push(`P&L,Expenses,${pl.expenses},,`);
    rows.push(`P&L,Commissions,${pl.commissions},,`);
    rows.push(`P&L,Net Profit,${pl.netProfit},,`);
    for (const s of staff) {
      rows.push(
        `Staff,${this.csvEscape(s.employeeName)},${s.bookings},${s.revenue},${s.utilizationPercent}`,
      );
    }
    for (const s of services) {
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
