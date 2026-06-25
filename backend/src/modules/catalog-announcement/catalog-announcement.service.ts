import { buildTenantPublicUrl } from '../../common/utils/tenant-public-url.util.js';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { EmailService } from '../notifications/email.service.js';
import { ConsumerPushDispatchService } from '../notifications/consumer-push-dispatch.service.js';
import { buildConsumerCatalogAnnouncementPushPayload } from '../notifications/consumer-transactional-push.util.js';
import { mergeBusinessNotificationSettings } from '../notifications/notification.types.js';
import { MarketingAutomationLog } from '../marketing-automation/entities/marketing-automation-log.entity.js';
import { resolveCustomerNotificationLocale } from '../../common/utils/customer-notification-locale.util.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import type { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import type { SubscriptionPlan } from '../service-subscriptions/entities/subscription.entity.js';
import type {
  CatalogAnnouncementSendSummary,
  CatalogNotifyRequest,
} from './catalog-announcement.types.js';
import {
  buildCatalogAnnouncementContext,
  formatCatalogDiscountLabel,
  isCustomerEligibleForCatalogEmail,
  isCustomerEligibleForCatalogPush,
  renderCatalogAnnouncementTemplate,
  resolveCatalogAnnouncementTemplate,
} from './catalog-announcement.util.js';

@Injectable()
export class CatalogAnnouncementService {
  private readonly logger = new Logger(CatalogAnnouncementService.name);

  constructor(
    @InjectRepository(Business)
    private businessRepo: Repository<Business>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(MarketingAutomationLog)
    private logRepo: Repository<MarketingAutomationLog>,
    private emailService: EmailService,
    private consumerPushDispatch: ConsumerPushDispatchService,
    private configService: ConfigService,
  ) {}

  async announcePackage(
    businessId: string,
    pkg: ServicePackage,
    request: CatalogNotifyRequest,
  ): Promise<CatalogAnnouncementSendSummary> {
    const business = await this.loadBusiness(businessId);
    const discount = formatCatalogDiscountLabel(
      pkg.discountType,
      Number(pkg.discountValue),
      business.settings as Record<string, unknown>,
    );
    return this.broadcast({
      business,
      request,
      kind: 'package',
      catalogName: pkg.name,
      discount,
      bookUrl: this.buildBookUrl(business.slug, '/any'),
    });
  }

  async announceSubscriptionPlan(
    businessId: string,
    plan: SubscriptionPlan,
    request: CatalogNotifyRequest,
  ): Promise<CatalogAnnouncementSendSummary> {
    const business = await this.loadBusiness(businessId);
    const discount = formatCatalogDiscountLabel(
      plan.discountType,
      Number(plan.discountValue),
      business.settings as Record<string, unknown>,
    );
    return this.broadcast({
      business,
      request,
      kind: 'subscription_plan',
      catalogName: plan.name,
      discount,
      bookUrl: this.buildBookUrl(business.slug),
    });
  }

  private async broadcast(input: {
    business: Business;
    request: CatalogNotifyRequest;
    kind: 'package' | 'subscription_plan';
    catalogName: string;
    discount: string;
    bookUrl: string;
  }): Promise<CatalogAnnouncementSendSummary> {
    const summary: CatalogAnnouncementSendSummary = {
      emailed: 0,
      pushed: 0,
      skipped: 0,
      failed: 0,
    };
    const notificationSettings = mergeBusinessNotificationSettings(
      input.business.settings?.notifications as Record<string, unknown>,
    );
    const customers = await this.customerRepo.find({
      where: { businessId: input.business.id, isActive: true },
    });

    for (const customer of customers) {
      const locale = resolveCustomerNotificationLocale(
        customer.metadata,
        input.business.settings as Record<string, unknown>,
      );
      const template = resolveCatalogAnnouncementTemplate(
        input.request,
        locale,
        input.kind === 'package' ? 'package' : 'subscription_plan',
        input.business.settings as Record<string, unknown>,
      );
      if (!template) {
        summary.skipped += 1;
        continue;
      }

      const context = buildCatalogAnnouncementContext({
        customerName: customer.name,
        businessName: input.business.name,
        bookUrl: input.bookUrl,
        discount: input.discount,
        packageName:
          input.kind === 'package' ? input.catalogName : undefined,
        planName:
          input.kind === 'subscription_plan' ? input.catalogName : undefined,
      });
      const subject = renderCatalogAnnouncementTemplate(
        template.subject,
        context,
      );
      const bodyText = renderCatalogAnnouncementTemplate(
        template.bodyText,
        context,
      );

      if (
        isCustomerEligibleForCatalogEmail(customer) &&
        notificationSettings.emailEnabled
      ) {
        const ok = await this.sendEmail(
          input.business.id,
          customer,
          locale,
          customer.email!.trim(),
          subject,
          bodyText,
        );
        if (ok) summary.emailed += 1;
        else summary.failed += 1;
      }

      if (isCustomerEligibleForCatalogPush(customer)) {
        const ok = await this.sendPush(
          input.business.id,
          customer,
          input.bookUrl,
          subject,
          bodyText,
        );
        if (ok) summary.pushed += 1;
        else summary.failed += 1;
      }

      if (
        !isCustomerEligibleForCatalogEmail(customer) &&
        !isCustomerEligibleForCatalogPush(customer)
      ) {
        summary.skipped += 1;
      }
    }

    this.logger.log(
      `Catalog announcement (${input.kind}) for business ${input.business.id}: emailed=${summary.emailed} pushed=${summary.pushed} skipped=${summary.skipped} failed=${summary.failed}`,
    );
    return summary;
  }

  private async sendEmail(
    businessId: string,
    customer: Customer,
    locale: AppLocale,
    email: string,
    subject: string,
    bodyText: string,
  ): Promise<boolean> {
    const result = await this.emailService.send({
      to: email,
      subject,
      text: bodyText,
      html: `<p>${escapeHtml(bodyText).replace(/\n/g, '<br/>')}</p>`,
    });
    await this.logRepo.save(
      this.logRepo.create({
        businessId,
        customerId: customer.id,
        kind: 'catalog_announcement',
        channel: 'email',
        serviceId: null,
        recipient: email,
        status: result.ok ? 'sent' : 'failed',
        error: result.error ?? null,
      }),
    );
    return result.ok;
  }

  private async sendPush(
    businessId: string,
    customer: Customer,
    url: string,
    title: string,
    body: string,
  ): Promise<boolean> {
    const payload = buildConsumerCatalogAnnouncementPushPayload({
      url,
      businessId,
      customerId: customer.id,
      title,
      body,
    });
    const result = await this.consumerPushDispatch.sendTransactionalPush(payload);
    await this.logRepo.save(
      this.logRepo.create({
        businessId,
        customerId: customer.id,
        kind: 'catalog_announcement',
        channel: 'push',
        serviceId: null,
        recipient: customer.id,
        status: result.ok ? 'sent' : result.skipped ? 'skipped' : 'failed',
        error: result.reason ?? null,
      }),
    );
    return result.ok;
  }

  private async loadBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) {
      throw new Error(`Business ${businessId} not found`);
    }
    return business;
  }

  private buildBookUrl(slug: string, pathSuffix = ''): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return buildTenantPublicUrl({
      slug,
      frontendUrl,
      rootDomain: this.configService.get<string>('ROOT_DOMAIN'),
      pathSuffix,
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
