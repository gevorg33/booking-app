import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../booking/entities/booking.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { CustomerSubscription } from '../service-subscriptions/entities/subscription.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardChangeRequest } from '../gift-cards/entities/gift-card-change-request.entity.js';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { CustomerService } from '../customer/customer.service.js';
import type { CustomerPrivacyService } from '../customer/customer-privacy.service.js';
import type { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import type { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import type { ServicePackagesService } from '../service-packages/service-packages.service.js';
import type { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import { isCustomerTag } from '../customer/customer-tag.constants.js';
import { readBusinessGiftCardSettings } from '../gift-cards/gift-card.types.js';
import { addMonths } from '../../common/utils/subscription-pricing.util.js';
import {
  decomposeCrmCompoundPrompt,
  type CrmCompoundStep,
} from './ai-customer-crm.util.js';
import { handleExplainMySubscriptionLogic } from './ai-explain-my-subscription.logic.js';
import {
  handlePrivacyExportLogic as handlePrivacyExportLogicImpl,
  type PrivacyExportLogicDeps,
} from './ai-privacy-export.logic.js';
import {
  handlePrivacyDeleteLogic as handlePrivacyDeleteLogicImpl,
  type PrivacyDeleteLogicDeps,
} from './ai-privacy-delete.logic.js';
import type { GiftCardClaimService } from '../gift-cards/gift-card-claim.service.js';
import { handleClaimGiftCardBalanceLogic as handleClaimGiftCardBalanceLogicImpl } from './ai-claim-gift-card-balance.logic.js';
import type { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';

export interface CustomerCrmLogicDeps
  extends PrivacyExportLogicDeps, PrivacyDeleteLogicDeps {
  customerService: CustomerService;
  customerPrivacyService: CustomerPrivacyService;
  subscriptionsService: ServiceSubscriptionsService;
  giftCardOrderService: GiftCardOrderService;
  giftCardClaimService: Pick<GiftCardClaimService, 'claimByCode'>;
  packagesService: ServicePackagesService;
  zendeskService: ZendeskIntegrationService;
  bookingRepo: Repository<Booking>;
  customerRepo: Repository<Customer>;
  subscriptionRepo: Repository<CustomerSubscription>;
  changeRequestRepo: Repository<GiftCardChangeRequest>;
  giftCardRepo: Repository<GiftCard>;
  businessRepo: Repository<Business>;
  publicCustomerAuthService: Pick<
    PublicCustomerAuthService,
    'getPreferredLocale' | 'updatePreferredLocale' | 'updateMyProfile'
  >;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === needle) ??
    list.find((item) => item.name.toLowerCase().includes(needle))
  );
}

function resolveCustomer(
  customers: Customer[],
  params: Record<string, any>,
  resolveCustomerFn?: (list: Customer[], name: string) => Customer | undefined,
): Customer | undefined {
  if (params.customerId)
    return customers.find((c) => c.id === params.customerId);
  const name = params.customerName as string | undefined;
  if (!name) return undefined;
  return resolveCustomerFn
    ? resolveCustomerFn(customers, name)
    : resolveByName(customers, name);
}

function resolveSessionCustomerId(
  params: Record<string, any>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

export async function handleListCustomerSubscriptionsLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'list_customer_subscriptions',
      'Specify which customer (e.g. "List Anna\'s subscriptions").',
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const subs = await deps.subscriptionsService.listCustomerSubscriptions(
    businessId,
    customer.id,
  );
  return success(
    'list_customer_subscriptions',
    subs.length
      ? `${customer.name} has ${subs.length} subscription(s).`
      : `${customer.name} has no subscriptions.`,
    { customerId: customer.id, subscriptions: subs, count: subs.length },
  );
}

export async function handleSubscriptionUsageHistoryLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'subscription_usage_history',
      'Specify customer and subscription plan.',
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const subs = await deps.subscriptionsService.listCustomerSubscriptions(
    businessId,
    customer.id,
  );
  const sub = params.subscriptionId
    ? subs.find((s) => s.id === params.subscriptionId)
    : resolveByName(
        subs.map((s) => ({ ...s, name: (s as any).plan?.name ?? s.id })),
        (params.planName as string) ?? '',
      );
  if (!sub) {
    return failure(
      'subscription_usage_history',
      'Subscription not found for this customer.',
      {
        clarify: true,
        missing: ['planName'],
      },
    );
  }
  const history = await deps.subscriptionsService.getUsageHistory(
    businessId,
    sub.id,
  );
  return success(
    'subscription_usage_history',
    `Usage history for ${customer.name} — ${history.usage.length} event(s).`,
    { customerId: customer.id, subscriptionId: sub.id, ...history },
  );
}

export async function handleExtendSubscriptionLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  const extendMonths = Number(params.extendMonths ?? 0);
  if (!customer || extendMonths < 1) {
    return failure(
      'extend_subscription',
      'Specify customer and how many months to extend (e.g. "Extend Anna\'s nail plan 3 months").',
      { clarify: true, missing: ['customerName', 'extendMonths'] },
    );
  }
  const subs = await deps.subscriptionsService.listCustomerSubscriptions(
    businessId,
    customer.id,
  );
  const sub = params.subscriptionId
    ? subs.find((s) => s.id === params.subscriptionId)
    : resolveByName(
        subs.map((s) => ({ ...s, name: (s as any).plan?.name ?? s.id })),
        (params.planName as string) ?? '',
      );
  if (!sub)
    return failure('extend_subscription', 'Active subscription not found.');

  sub.expiresAt = addMonths(sub.expiresAt, extendMonths);
  await deps.subscriptionRepo.save(sub);
  return success(
    'extend_subscription',
    `Extended ${customer.name}'s subscription by ${extendMonths} month(s) — now expires ${sub.expiresAt.toISOString().slice(0, 10)}.`,
    { subscriptionId: sub.id, expiresAt: sub.expiresAt },
  );
}

export async function handleCancelSubscriptionAdminLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'cancel_subscription_admin',
      "Specify which customer's subscription to cancel.",
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const subs = await deps.subscriptionsService.listCustomerSubscriptions(
    businessId,
    customer.id,
  );
  const sub = params.subscriptionId
    ? subs.find((s) => s.id === params.subscriptionId)
    : resolveByName(
        subs.map((s) => ({ ...s, name: (s as any).plan?.name ?? s.id })),
        (params.planName as string) ?? '',
      );
  if (!sub)
    return failure('cancel_subscription_admin', 'Subscription not found.');

  await deps.subscriptionsService.cancelSubscription(businessId, sub.id);
  return success(
    'cancel_subscription_admin',
    `Cancelled ${customer.name}'s subscription.`,
    { subscriptionId: sub.id, customerId: customer.id },
  );
}

export async function handleListCustomerGiftCardsLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'list_customer_gift_cards',
      "Specify which customer's gift cards to list.",
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const account = await deps.giftCardOrderService.listCustomerGiftCardAccount(
    businessId,
    customer.id,
  );
  const count = account.orders.length + account.redeemed.length;
  return success(
    'list_customer_gift_cards',
    count
      ? `${customer.name} has ${count} gift card record(s).`
      : `${customer.name} has no gift cards.`,
    { customerId: customer.id, account, count },
  );
}

export async function handleListCustomerBookingsLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'list_customer_bookings',
      "Specify which customer's appointments to list.",
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const detail = await deps.customerService.getCustomerDetail(
    businessId,
    customer.id,
  );
  return success(
    'list_customer_bookings',
    `${customer.name} — ${detail.appointments.length} appointment(s).`,
    {
      customerId: customer.id,
      appointments: detail.appointments,
      stats: detail.stats,
    },
  );
}

export async function handleCustomerNoShowHistoryLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'customer_no_show_history',
      "Specify which customer's no-show history.",
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const bookings = await deps.bookingRepo.find({
    where: {
      businessId,
      customerId: customer.id,
      status: BookingStatus.NO_SHOW,
    },
    relations: { service: true, employee: true },
    order: { startTime: 'DESC' },
    take: 50,
  });
  return success(
    'customer_no_show_history',
    `${customer.name} — ${bookings.length} no-show(s).`,
    { customerId: customer.id, noShows: bookings, count: bookings.length },
  );
}

export async function handleTagCustomerLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  const rawTag = ((params.tag as string) ?? '')
    .toLowerCase()
    .replace(/[\s-]/g, '_');
  const tag = rawTag === 'at_risk' ? 'regular' : rawTag;
  if (!customer) {
    return failure(
      'tag_customer',
      'Specify customer and tag (e.g. "Tag Maria as VIP").',
      {
        clarify: true,
        missing: ['customerName', 'tag'],
      },
    );
  }
  if (!isCustomerTag(tag)) {
    return failure(
      'tag_customer',
      `Tag must be one of: vip, regular, persona, corporate, referral.`,
    );
  }
  const updated = await deps.customerService.update(customer.id, {
    tags: [tag],
  });
  return success('tag_customer', `Tagged ${updated.name} as ${tag}.`, {
    customerId: updated.id,
    tags: updated.tags,
  });
}

export async function handleUpdateCustomerLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'update_customer',
      'Specify which customer to update (customerName or customerId).',
      { clarify: true, missing: ['customerName'] },
    );
  }

  const name =
    typeof params.newName === 'string' ? params.newName.trim() : undefined;
  const email =
    typeof params.email === 'string' ? params.email.trim() : undefined;
  const phone =
    typeof params.phone === 'string' ? params.phone.trim() : undefined;
  const isVip = typeof params.isVip === 'boolean' ? params.isVip : undefined;

  if (
    name === undefined &&
    email === undefined &&
    phone === undefined &&
    isVip === undefined
  ) {
    return failure(
      'update_customer',
      `What should I change for ${customer.name}? Provide a new name, email, phone, or VIP status.`,
    );
  }

  try {
    const updated = await deps.customerService.update(customer.id, {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(isVip !== undefined ? { isVip } : {}),
    });
    const changes = [
      name !== undefined ? `name → ${name}` : null,
      email !== undefined ? `email → ${email}` : null,
      phone !== undefined ? `phone → ${phone}` : null,
      isVip !== undefined ? `VIP → ${isVip}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    return success(
      'update_customer',
      `Updated ${updated.name}: ${changes}.`,
      { customerId: updated.id, customerName: updated.name },
    );
  } catch (err: any) {
    return failure(
      'update_customer',
      err?.message ?? 'Could not update the customer.',
    );
  }
}

export async function handleExportCustomerDataLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'export_customer_data',
      'Specify which customer to export.',
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const data = await deps.customerPrivacyService.exportCustomerData(
    businessId,
    customer.id,
  );
  return success(
    'export_customer_data',
    `Exported data for ${customer.name}.`,
    { export: data },
  );
}

export async function handleDeleteCustomerDataLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer) {
    return failure(
      'delete_customer_data',
      'Specify which customer to anonymize.',
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  await deps.customerPrivacyService.deleteCustomerData(businessId, customer.id);
  return success(
    'delete_customer_data',
    `Anonymized customer data for ${customer.name}.`,
    { customerId: customer.id },
  );
}

export async function handleSendReengagementMessageLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const customer = resolveCustomer(customers, params, resolveCustomerFn);
  if (!customer?.email) {
    return failure(
      'send_reengagement_message',
      'Specify a customer with an email address.',
      {
        clarify: true,
        missing: ['customerName'],
      },
    );
  }
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const message =
    (params.message as string) ??
    "We miss you — book your next visit when you're ready.";
  try {
    const ticket = await deps.zendeskService.createSupportTicket(
      businessId,
      {
        subject: `Re-engagement — ${customer.name}`,
        body: message,
        customerId: customer.id,
        requesterEmail: customer.email,
        requesterName: customer.name,
        tags: ['reengagement', 'crm'],
      },
      customer.email,
      customer.name,
    );
    return success(
      'send_reengagement_message',
      `Re-engagement ticket created for ${customer.name}.`,
      { customerId: customer.id, ticket, businessName: business?.name },
    );
  } catch {
    return failure(
      'send_reengagement_message',
      'Could not create re-engagement ticket — check Zendesk configuration.',
    );
  }
}

export async function handleMergeCustomersLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
): Promise<CommandResult> {
  const primaryName = params.primaryCustomerName as string | undefined;
  const secondaryName = params.secondaryCustomerName as string | undefined;
  const primary = params.primaryCustomerId
    ? customers.find((c) => c.id === params.primaryCustomerId)
    : primaryName
      ? resolveCustomerFn(customers, primaryName)
      : undefined;
  const secondary = params.secondaryCustomerId
    ? customers.find((c) => c.id === params.secondaryCustomerId)
    : secondaryName
      ? resolveCustomerFn(customers, secondaryName)
      : undefined;

  if (!primary || !secondary || primary.id === secondary.id) {
    return failure(
      'merge_customers',
      'Specify two distinct customers to merge (primaryCustomerName + secondaryCustomerName).',
      {
        clarify: true,
        missing: ['primaryCustomerName', 'secondaryCustomerName'],
      },
    );
  }

  await deps.bookingRepo.update(
    { businessId, customerId: secondary.id },
    { customerId: primary.id },
  );
  await deps.subscriptionRepo.update(
    { businessId, customerId: secondary.id },
    { customerId: primary.id },
  );
  await deps.customerService.remove(secondary.id);

  return success(
    'merge_customers',
    `Merged "${secondary.name}" into "${primary.name}" — bookings and subscriptions moved.`,
    { primaryCustomerId: primary.id, mergedCustomerId: secondary.id },
  );
}

export async function handleMyProfileLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('my_profile', 'Sign in to view your profile.', {
      clarify: true,
    });
  }
  const detail = await deps.customerService.getCustomerDetail(
    businessId,
    customerId,
  );
  return success('my_profile', 'Your profile.', {
    profile: detail.customer,
    stats: detail.stats,
  });
}

export async function handleMyAppointmentsLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('my_appointments', 'Sign in to view your appointments.', {
      clarify: true,
    });
  }
  const detail = await deps.customerService.getCustomerDetail(
    businessId,
    customerId,
  );
  return success(
    'my_appointments',
    `You have ${detail.appointments.length} appointment(s) on record.`,
    { appointments: detail.appointments },
  );
}

export async function handleMySubscriptionsLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('my_subscriptions', 'Sign in to view your subscriptions.', {
      clarify: true,
    });
  }
  const subs = await deps.subscriptionsService.listCustomerSubscriptions(
    businessId,
    customerId,
  );
  return success(
    'my_subscriptions',
    subs.length
      ? `You have ${subs.length} subscription(s).`
      : 'You have no subscriptions.',
    {
      subscriptions: subs,
      count: subs.length,
      navigate: { path: 'account', query: { tab: 'subscriptions' } },
    },
  );
}

export async function handleSubscriptionUsageLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'subscription_usage',
      'Sign in to view subscription usage.',
      { clarify: true },
    );
  }
  const subs = await deps.subscriptionsService.listCustomerSubscriptions(
    businessId,
    customerId,
  );
  const sub = params.subscriptionId
    ? subs.find((s) => s.id === params.subscriptionId)
    : subs[0];
  if (!sub) return failure('subscription_usage', 'No subscription found.');
  const usage = await deps.subscriptionsService.getCustomerSubscriptionUsage(
    businessId,
    customerId,
    sub.id,
  );
  return success(
    'subscription_usage',
    `${usage.usage.length} usage event(s) — ${sub.appointmentsRemaining} visit(s) remaining.`,
    {
      ...usage,
      navigate: {
        path: 'account',
        query: { tab: 'subscriptions', subscriptionId: sub.id },
      },
    },
  );
}

export async function handleMyGiftCardsLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure('my_gift_cards', 'Sign in to view your gift cards.', {
      clarify: true,
    });
  }
  const account = await deps.giftCardOrderService.listCustomerGiftCardAccount(
    businessId,
    customerId,
  );
  return success('my_gift_cards', 'Your gift cards.', { account });
}

export async function handleGiftCardBalanceLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure('gift_card_balance', 'Sign in to check gift card balance.', {
      clarify: true,
    });
  const account = await deps.giftCardOrderService.listCustomerGiftCardAccount(
    businessId,
    customerId,
  );
  const code = params.giftCardCode as string | undefined;
  const card = code
    ? [...account.orders, ...account.redeemed].find((c) => c.code === code)
    : (account.redeemed[0] ?? account.orders[0]);
  if (!card) return failure('gift_card_balance', 'Gift card not found.');
  return success(
    'gift_card_balance',
    `Balance: ${(card as any).balance ?? (card as any).remainingBalance ?? 'n/a'}.`,
    {
      giftCard: card,
    },
  );
}

export async function handleGiftCardRedemptionHistoryLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId)
    return failure('gift_card_redemption_history', 'Sign in first.', {
      clarify: true,
    });
  const account = await deps.giftCardOrderService.listCustomerGiftCardAccount(
    businessId,
    customerId,
  );
  return success(
    'gift_card_redemption_history',
    `${account.redeemed.length} redeemed gift card(s).`,
    { redeemed: account.redeemed },
  );
}

export async function handleRequestGiftCardCancelLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  const giftCardId = params.giftCardId as string | undefined;
  if (!customerId || !giftCardId) {
    return failure(
      'request_gift_card_cancel',
      'Specify which gift card order to cancel.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }
  try {
    const result = await deps.giftCardOrderService.submitCancelRequest(
      businessId,
      customerId,
      giftCardId,
      params.customerNotes as string | undefined,
    );
    return success(
      'request_gift_card_cancel',
      'Gift card cancel request submitted.',
      { ...result },
    );
  } catch (err: any) {
    return failure(
      'request_gift_card_cancel',
      err?.message ?? 'Cancel not available for this order.',
    );
  }
}

export async function handleRequestGiftCardModifyLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  const giftCardId = params.giftCardId as string | undefined;
  if (!customerId || !giftCardId) {
    return failure(
      'request_gift_card_modify',
      'Specify which gift card order to modify.',
      {
        clarify: true,
        missing: ['giftCardId'],
      },
    );
  }

  await deps.giftCardOrderService.getCustomerOrder(
    businessId,
    customerId,
    giftCardId,
  );
  const card = await deps.giftCardRepo.findOne({
    where: { id: giftCardId, businessId, purchaserCustomerId: customerId },
    relations: { serviceCredits: true },
  });
  if (!card)
    return failure('request_gift_card_modify', 'Gift card order not found.');

  const request = await deps.changeRequestRepo.save(
    deps.changeRequestRepo.create({
      giftCardId,
      businessId,
      customerId,
      requestType: 'modify',
      status: 'pending',
      customerNotes:
        (params.customerNotes as string) ?? 'Modify request via AI assistant',
      modifyPayload: (params.modifyPayload as Record<string, unknown>) ?? null,
    }),
  );

  try {
    const ticket = await deps.zendeskService.createGiftCardChangeTicket(
      businessId,
      {
        id: card.id,
        code: card.code,
        cardType: card.cardType,
        deliveryMethod: card.deliveryMethod,
        fulfillmentStatus: card.fulfillmentStatus,
        purchaseAmount: card.purchaseAmount,
        balance: card.balance,
        expiresAt: card.expiresAt,
        recipientName: card.recipientName,
        recipientEmail: card.recipientEmail,
        purchaserEmail: card.purchaserEmail,
        serviceCredits: (card.serviceCredits ?? []).map((c) => ({
          serviceName: c.serviceName ?? c.serviceId,
          quantityRemaining: c.quantityRemaining,
        })),
      },
      {
        id: request.id,
        requestType: 'modify',
        customerNotes: request.customerNotes,
        modifyPayload: request.modifyPayload,
      },
    );
    request.zendeskTicketId = String(ticket.ticketId);
    await deps.changeRequestRepo.save(request);
    return success(
      'request_gift_card_modify',
      'Modify request sent to support — a specialist will follow up.',
      { requestId: request.id, ticket },
    );
  } catch {
    return success(
      'request_gift_card_modify',
      'Modify request recorded — support will review shortly.',
      { requestId: request.id, zendeskPending: true },
    );
  }
}

export async function handleTrackPhysicalGiftCardOrderLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  const giftCardId = params.giftCardId as string | undefined;
  if (!customerId)
    return failure(
      'track_physical_gift_card_order',
      'Sign in to track your order.',
      { clarify: true },
    );

  const account = await deps.giftCardOrderService.listCustomerGiftCardAccount(
    businessId,
    customerId,
  );
  const physical = account.orders.filter(
    (o) => o.deliveryMethod === 'physical',
  );
  const order = giftCardId
    ? physical.find((o) => o.id === giftCardId)
    : physical[0];
  if (!order)
    return failure(
      'track_physical_gift_card_order',
      'No physical gift card order found.',
    );

  return success(
    'track_physical_gift_card_order',
    `Order status: ${order.fulfillmentStatus ?? 'processing'}.`,
    { order },
  );
}

export async function handleExplainGiftCardOrderLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  const giftCardId = params.giftCardId as string | undefined;
  if (!customerId) {
    return failure(
      'explain_gift_card_order',
      'Sign in to view your gift card order.',
      { clarify: true },
    );
  }
  if (!giftCardId) {
    return failure(
      'explain_gift_card_order',
      'Specify which gift card order you mean.',
      { clarify: true, missing: ['giftCardId'] },
    );
  }

  try {
    const order = await deps.giftCardOrderService.getCustomerOrder(
      businessId,
      customerId,
      giftCardId,
    );
    return success(
      'explain_gift_card_order',
      `${order.cardType} gift card — balance $${order.balance.toFixed(2)}, ${order.deliveryMethod} delivery, status ${order.fulfillmentStatus ?? 'active'}.`,
      { order },
    );
  } catch (err: any) {
    return failure(
      'explain_gift_card_order',
      err?.message ?? 'Gift card order not found.',
      { giftCardId },
    );
  }
}

export async function handlePrivacyExportLogic(
  deps: PrivacyExportLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  return handlePrivacyExportLogicImpl(deps, businessId, params, prompt);
}

export async function handlePrivacyDeleteLogic(
  deps: PrivacyDeleteLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  return handlePrivacyDeleteLogicImpl(deps, businessId, params, prompt);
}

export async function handleClaimGiftCardBalanceLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  return handleClaimGiftCardBalanceLogicImpl(deps, businessId, params, prompt);
}

export async function handleDiscoverPackagesLogic(
  deps: Pick<CustomerCrmLogicDeps, 'packagesService'>,
  businessId: string,
): Promise<CommandResult> {
  const packages = await deps.packagesService.listPackages(
    businessId,
    'active',
  );
  return success(
    'discover_packages',
    packages.length
      ? `${packages.length} package(s) available.`
      : 'No packages available right now.',
    {
      packages,
      count: packages.length,
      navigate: { path: 'packages', query: {} },
    },
  );
}

export async function handleDiscoverSubscriptionPlansLogic(
  deps: Pick<CustomerCrmLogicDeps, 'subscriptionsService'>,
  businessId: string,
  params: Record<string, any>,
  serviceId?: string,
): Promise<CommandResult> {
  const plans = await deps.subscriptionsService.listPlans(
    businessId,
    serviceId ?? (params.serviceId as string),
    false,
  );
  return success(
    'discover_subscription_plans',
    plans.length
      ? `${plans.length} membership plan(s) available.`
      : 'No subscription plans available.',
    { plans, count: plans.length },
  );
}

export async function handleDiscoverGiftCardProductsLogic(
  deps: Pick<CustomerCrmLogicDeps, 'businessRepo'>,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('discover_gift_card_products', 'Business not found.');
  const settings = readBusinessGiftCardSettings(business.settings);
  return success(
    'discover_gift_card_products',
    settings.purchaseEnabled
      ? `Gift cards available — presets: ${settings.presetAmounts.map((a) => `$${a}`).join(', ') || 'custom'}.`
      : 'Gift card purchase is not enabled for this salon.',
    { settings },
  );
}

export async function handleCrmCompoundLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  customers: Customer[],
  resolveCustomerFn: (list: Customer[], name: string) => Customer | undefined,
  userId?: string,
): Promise<CommandResult> {
  const steps: CrmCompoundStep[] =
    (params.compoundSteps as CrmCompoundStep[] | undefined) ??
    decomposeCrmCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple CRM commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  for (const step of steps.slice(0, 4)) {
    const stepParams = { ...step.params, ...params };
    let result: CommandResult;
    switch (step.action) {
      case 'list_customer_subscriptions':
        result = await handleListCustomerSubscriptionsLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'list_customer_gift_cards':
        result = await handleListCustomerGiftCardsLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'list_customer_bookings':
        result = await handleListCustomerBookingsLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'subscription_usage_history':
        result = await handleSubscriptionUsageHistoryLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'customer_no_show_history':
        result = await handleCustomerNoShowHistoryLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'tag_customer':
        result = await handleTagCustomerLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'extend_subscription':
        result = await handleExtendSubscriptionLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'export_customer_data':
        result = await handleExportCustomerDataLogic(
          deps,
          businessId,
          stepParams,
          customers,
          resolveCustomerFn,
        );
        break;
      case 'my_appointments':
        result = await handleMyAppointmentsLogic(deps, businessId, stepParams);
        break;
      case 'my_subscriptions':
        result = await handleMySubscriptionsLogic(deps, businessId, stepParams);
        break;
      case 'explain_my_subscription':
        result = await handleExplainMySubscriptionLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'my_gift_cards':
        result = await handleMyGiftCardsLogic(deps, businessId, stepParams);
        break;
      case 'gift_card_balance':
        result = await handleGiftCardBalanceLogic(deps, businessId, stepParams);
        break;
      case 'discover_packages':
        result = await handleDiscoverPackagesLogic(deps, businessId);
        break;
      case 'discover_subscription_plans':
        result = await handleDiscoverSubscriptionPlansLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'discover_gift_card_products':
        result = await handleDiscoverGiftCardProductsLogic(deps, businessId);
        break;
      default:
        result = failure(
          step.action,
          `Unsupported CRM compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
          userId,
        },
      };
    }
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} CRM step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      crmCompound: true,
      userId,
    },
  };
}
