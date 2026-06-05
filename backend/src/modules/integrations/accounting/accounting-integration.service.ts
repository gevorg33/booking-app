import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Business } from '../../business/entities/business.entity.js';
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from '../../booking/entities/booking.entity.js';
import { Expense } from '../../expenses/entities/expense.entity.js';
import { CommissionRule } from '../../commissions/entities/commission-rule.entity.js';
import { CustomerSubscription } from '../../service-subscriptions/entities/subscription.entity.js';
import { UpdateAccountingIntegrationDto } from '../dto/update-accounting-integration.dto.js';
import { parseDateRange } from '../../analytics/dto/analytics-query.dto.js';
import {
  AccountingExportRow,
  AccountingExportResult,
  AccountingProvider,
  BusinessAccountingIntegration,
  getBusinessAccountingIntegration,
} from './accounting-integration.types.js';
import { AccountingExportService } from './accounting-export.service.js';

export interface AccountingIntegrationPublicView {
  enabled: boolean;
  provider: AccountingProvider;
  incomeAccountName?: string;
  accountCode?: string;
  includeCommissions: boolean;
  includeExpenses: boolean;
}

@Injectable()
export class AccountingIntegrationService {
  private readonly businessRepo: Repository<Business>;
  private readonly bookingRepo: Repository<Booking>;
  private readonly expenseRepo: Repository<Expense>;
  private readonly commissionRepo: Repository<CommissionRule>;
  private readonly customerSubscriptionRepo: Repository<CustomerSubscription>;
  private readonly exportService: AccountingExportService;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Expense) expenseRepo: Repository<Expense>,
    @InjectRepository(CommissionRule)
    commissionRepo: Repository<CommissionRule>,
    @InjectRepository(CustomerSubscription)
    customerSubscriptionRepo: Repository<CustomerSubscription>,
    exportService: AccountingExportService,
  ) {
    this.businessRepo = businessRepo;
    this.bookingRepo = bookingRepo;
    this.expenseRepo = expenseRepo;
    this.commissionRepo = commissionRepo;
    this.customerSubscriptionRepo = customerSubscriptionRepo;
    this.exportService = exportService;
  }

  async getPublicSettings(
    businessId: string,
  ): Promise<AccountingIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const acct = getBusinessAccountingIntegration(business.settings);
    return {
      enabled: Boolean(acct.enabled),
      provider: acct.provider || 'csv',
      incomeAccountName: acct.incomeAccountName,
      accountCode: acct.accountCode,
      includeCommissions: acct.includeCommissions !== false,
      includeExpenses: acct.includeExpenses !== false,
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateAccountingIntegrationDto,
  ): Promise<AccountingIntegrationPublicView> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const settings = { ...(business.settings || {}) };
    const integrations = {
      ...((settings.integrations as Record<string, unknown>) || {}),
    };
    const current = getBusinessAccountingIntegration(settings);

    const next: BusinessAccountingIntegration = { ...current };
    if (dto.enabled !== undefined) next.enabled = dto.enabled;
    if (dto.provider !== undefined) next.provider = dto.provider;
    if (dto.incomeAccountName !== undefined) {
      next.incomeAccountName = dto.incomeAccountName.trim() || undefined;
    }
    if (dto.accountCode !== undefined)
      next.accountCode = dto.accountCode.trim() || undefined;
    if (dto.includeCommissions !== undefined)
      next.includeCommissions = dto.includeCommissions;
    if (dto.includeExpenses !== undefined)
      next.includeExpenses = dto.includeExpenses;

    integrations.accounting = next;
    settings.integrations = integrations;
    business.settings = settings;
    await this.businessRepo.save(business);

    return this.getPublicSettings(businessId);
  }

  async generateExport(
    businessId: string,
    from?: string,
    to?: string,
  ): Promise<AccountingExportResult> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    const acct = getBusinessAccountingIntegration(business.settings);
    if (!acct.enabled) {
      throw new BadRequestException(
        'Accounting integration is not enabled for this business',
      );
    }
    const provider = acct.provider || 'csv';
    const { start, end } = parseDateRange(from, to);
    const rows = await this.buildRows(businessId, start, end, acct);

    return this.exportService.buildExport(provider, rows, {
      incomeAccountName: acct.incomeAccountName,
      accountCode: acct.accountCode,
    });
  }

  private async buildRows(
    businessId: string,
    start: Date,
    end: Date,
    acct: BusinessAccountingIntegration,
  ): Promise<AccountingExportRow[]> {
    const rows: AccountingExportRow[] = [];

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(start, end),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
      },
      relations: { customer: true, employee: true, service: true },
      order: { startTime: 'ASC' },
    });

    for (const b of bookings) {
      if (!b.service) continue;
      rows.push({
        date: b.startTime.toISOString().slice(0, 10),
        description: b.service.name,
        amount: Number(b.service.price),
        currency: b.service.currency || 'USD',
        type: 'income',
        incomeSubType: 'service',
        reference: b.id,
        customerName: b.customer?.name,
        employeeName: b.employee?.name,
      });
    }

    const subscriptions = await this.customerSubscriptionRepo.find({
      where: {
        businessId,
        createdAt: Between(start, end),
      },
      relations: { plan: true, customer: true },
      order: { createdAt: 'ASC' },
    });

    for (const sub of subscriptions) {
      const amount = Number(sub.pricePaid);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      rows.push({
        date: sub.createdAt.toISOString().slice(0, 10),
        description: sub.plan?.name ?? 'Subscription plan',
        amount,
        currency: sub.currency || 'USD',
        type: 'income',
        incomeSubType: 'subscription',
        reference: sub.id,
        customerName: sub.customer?.name,
      });
    }

    rows.sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.reference.localeCompare(b.reference),
    );

    if (acct.includeExpenses !== false) {
      const expenses = await this.expenseRepo
        .createQueryBuilder('e')
        .where('e.business_id = :businessId', { businessId })
        .andWhere('e.expenseDate BETWEEN :from AND :to', {
          from: start.toISOString().slice(0, 10),
          to: end.toISOString().slice(0, 10),
        })
        .getMany();

      for (const e of expenses) {
        rows.push({
          date: e.expenseDate,
          description: e.description || e.category,
          amount: -Math.abs(Number(e.amount)),
          currency: e.currency || 'USD',
          type: 'expense',
          reference: e.id,
        });
      }
    }

    if (acct.includeCommissions !== false) {
      const commissionTotal = await this.computeCommissions(
        businessId,
        start,
        end,
      );
      if (commissionTotal > 0) {
        rows.push({
          date: end.toISOString().slice(0, 10),
          description: 'Staff commissions',
          amount: -commissionTotal,
          currency: 'USD',
          type: 'commission',
          reference: `commissions-${start.toISOString().slice(0, 10)}`,
        });
      }
    }

    return rows;
  }

  private async computeCommissions(
    businessId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const rules = await this.commissionRepo.find({
      where: { businessId, isActive: true },
    });
    if (rules.length === 0) return 0;

    const bookings = await this.bookingRepo.find({
      where: {
        businessId,
        startTime: Between(start, end),
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
      },
      relations: { service: true },
    });

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
    return Math.round(total * 100) / 100;
  }
}
