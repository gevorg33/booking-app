import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { CustomerPrivacyService } from '../customer/customer-privacy.service.js';
import type { ComplianceBreachService } from '../compliance/compliance-breach.service.js';
import type { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import type { BusinessService } from '../business/business.service.js';
import type { PhiAccessAuditLog } from '../compliance/entities/phi-access-audit-log.entity.js';
import type { EnterpriseTrustService } from '../enterprise-trust/enterprise-trust.service.js';
import type { StrategyEvalService } from '../strategy-eval/strategy-eval.service.js';
import type { CommandResult } from './command-completion.types.js';
import { GDPR_BREACH_NOTIFICATION_HOURS } from '../../common/utils/breach-notification.util.js';
import {
  buildComplianceDashboardNavigate,
  compliancePanelLabel,
} from '../../common/utils/compliance-dashboard-nav.util.js';
import { mergeBusinessSettings } from '../../common/utils/merge-business-settings.util.js';
import {
  assertBusinessHipaaSettings,
  assertBusinessPrivacySettings,
  DEFAULT_HIPAA_BAA_VERSION,
  mergeBusinessHipaaSettings,
  mergeBusinessPrivacySettings,
  isHipaaEligibleBusinessType,
  PHI_FIELD_NAMES,
  SUB_PROCESSORS,
  readBusinessHipaaSettings,
  readBusinessPrivacySettings,
  toPublicBusinessPrivacySettings,
  buildComplianceStatusSummary,
  type BusinessPrivacySettings,
  type PublicBusinessPrivacySettings,
} from '../../common/utils/business-compliance.util.js';
import { PHI_ENCRYPTED_PREFIX } from '../../common/utils/phi-encryption.util.js';
import {
  formatComplianceStatusSummary,
  formatGdprChecklistSummary,
  formatSubProcessorsList,
  parseAcceptHipaaBaaFromPrompt,
  parseAdminDeleteCustomerDataFromPrompt,
  parseExplainEnterpriseTrustFromPrompt,
  parseExplainStrategyEvalFromPrompt,
  isUpdateStrategyEvalPrompt,
  parseConfigureGranularConsentFromPrompt,
  parseConfigurePrivacyRetentionFromPrompt,
  parseConfigureHipaaSessionTimeoutFromPrompt,
  parseEnableHipaaModeFromPrompt,
  parseExplainComplianceStatusFromPrompt,
  parseExplainGdprChecklistFromPrompt,
  parseExplainHipaaSessionTimeoutFromPrompt,
  parseListSubProcessorsFromPrompt,
  parseOpenComplianceDashboardFromPrompt,
  collectGdprMissingItems,
  parseExplainMinimumNecessaryPhiAccessFromPrompt,
  parseExplainPhiEncryptionStatusFromPrompt,
  parseListBreachIncidentsFromPrompt,
  parseReportDataBreachFromPrompt,
  parseSendBreachNotificationFromPrompt,
  parseViewPhiAccessAuditFromPrompt,
  formatPhiAccessAuditFieldLabel,
  summarizeGranularConsentChange,
  summarizeHipaaChange,
  summarizePrivacyRetentionChange,
} from './ai-business-compliance.util.js';
import {
  buildExplainDataRightsNavigate,
  parseExplainDataRightsFromPrompt,
  type DataRightsAspect,
} from './ai-data-rights.util.js';

export interface BusinessComplianceLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne' | 'save'>;
  customerRepo: Pick<Repository<Customer>, 'find'>;
  customerPrivacyService: Pick<CustomerPrivacyService, 'deleteCustomerData'>;
  complianceBreachService: Pick<
    ComplianceBreachService,
    'reportBreach' | 'listIncidents' | 'sendBreachNotification'
  >;
  phiAccessAuditService: Pick<PhiAccessAuditService, 'listForOwner'>;
  businessService: Pick<BusinessService, 'ensureOwner'>;
  enterpriseTrustService: Pick<
    EnterpriseTrustService,
    'getSettings' | 'updateSettings' | 'renderDocuments' | 'getSecurityOnePager'
  >;
  strategyEvalService: Pick<
    StrategyEvalService,
    | 'getSummary'
    | 'getHipaaFramework'
    | 'getMarketplaceFramework'
    | 'submitHipaaEval'
    | 'submitMarketplaceEval'
  >;
}

function resolveCustomerByName(
  customers: Customer[],
  name: string,
): Customer | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    customers.find((item) => item.name.toLowerCase() === needle) ??
    customers.find((item) => item.name.toLowerCase().includes(needle))
  );
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

export async function handleConfigurePrivacyRetentionLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigurePrivacyRetentionFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'configure_privacy_retention',
      'Specify privacy retention or cookie banner changes (e.g. "Keep customer data for 3 years" or "Enable cookie banner on our booking page").',
      { clarify: true, missing: ['retention', 'cookieBanner'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_privacy_retention', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const current = readBusinessPrivacySettings(settings);

  const nextInput: Partial<BusinessPrivacySettings> = {
    retention: parsed.retention
      ? { ...current.retention, ...parsed.retention }
      : current.retention,
    cookieBanner: parsed.cookieBanner
      ? {
          enabled: parsed.cookieBanner.enabled ?? current.cookieBanner.enabled,
          message: parsed.cookieBanner.message ?? current.cookieBanner.message,
        }
      : current.cookieBanner,
    granularConsent: current.granularConsent,
    privacyPolicyVersion: current.privacyPolicyVersion,
    dataResidencyRegion: current.dataResidencyRegion,
  };

  let normalized: BusinessPrivacySettings;
  try {
    normalized = assertBusinessPrivacySettings(nextInput, settings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid privacy settings';
    return failure('configure_privacy_retention', message, { clarify: true });
  }

  const changes = summarizePrivacyRetentionChange(current, normalized);
  if (changes.length === 0) {
    return success(
      'configure_privacy_retention',
      'Privacy retention and cookie banner settings are already configured as requested.',
      { privacy: normalized, unchanged: true },
    );
  }

  business.settings = mergeBusinessSettings(
    settings,
    mergeBusinessPrivacySettings(settings ?? {}, normalized),
  );
  await deps.businessRepo.save(business);

  return success(
    'configure_privacy_retention',
    `Privacy settings updated: ${changes.join('; ')}.`,
    { privacy: normalized, previousPrivacy: current, changes },
  );
}

export async function handleConfigureGranularConsentLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureGranularConsentFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'configure_granular_consent',
      'Specify granular consent toggles (e.g. "Require AI processing consent at checkout" or "Ask for third-party integration consent").',
      {
        clarify: true,
        missing: ['requireAiProcessing', 'requireThirdPartyIntegrations'],
      },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_granular_consent', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const current = readBusinessPrivacySettings(settings);

  const nextGranular = {
    requireAiProcessing:
      parsed.requireAiProcessing ?? current.granularConsent.requireAiProcessing,
    requireThirdPartyIntegrations:
      parsed.requireThirdPartyIntegrations ??
      current.granularConsent.requireThirdPartyIntegrations,
  };

  const nextInput: Partial<BusinessPrivacySettings> = {
    ...current,
    granularConsent: nextGranular,
  };

  let normalized: BusinessPrivacySettings;
  try {
    normalized = assertBusinessPrivacySettings(nextInput, settings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid privacy settings';
    return failure('configure_granular_consent', message, { clarify: true });
  }

  const changes = summarizeGranularConsentChange(
    current.granularConsent,
    normalized.granularConsent,
  );
  if (changes.length === 0) {
    return success(
      'configure_granular_consent',
      'Granular consent settings are already configured as requested.',
      { granularConsent: normalized.granularConsent, unchanged: true },
    );
  }

  business.settings = mergeBusinessSettings(
    settings,
    mergeBusinessPrivacySettings(settings ?? {}, normalized),
  );
  await deps.businessRepo.save(business);

  return success(
    'configure_granular_consent',
    `Granular consent updated: ${changes.join('; ')}.`,
    {
      granularConsent: normalized.granularConsent,
      previousGranularConsent: current.granularConsent,
      changes,
    },
  );
}

export async function handleEnableHipaaModeLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseEnableHipaaModeFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'enable_hipaa_mode',
      'Specify HIPAA changes (e.g. "Enable HIPAA safeguards" or "Set 15-minute session timeout for HIPAA").',
      { clarify: true, missing: ['enabled', 'sessionTimeoutMinutes'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('enable_hipaa_mode', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;
  const current = readBusinessHipaaSettings(settings);

  const nextInput = {
    ...current,
    ...(parsed.enabled !== undefined ? { enabled: parsed.enabled } : {}),
    ...(parsed.sessionTimeoutMinutes !== undefined
      ? { sessionTimeoutMinutes: parsed.sessionTimeoutMinutes }
      : {}),
  };

  let normalized;
  try {
    normalized = assertBusinessHipaaSettings(nextInput, businessType, settings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid HIPAA settings';
    const needsBaa =
      parsed.enabled === true &&
      message.includes('Business Associate Agreement');
    return failure('enable_hipaa_mode', message, {
      clarify: needsBaa,
      ...(needsBaa ? { missing: ['baaAcceptedAt'] } : {}),
    });
  }

  const changes = summarizeHipaaChange(current, normalized);
  if (changes.length === 0) {
    return success(
      'enable_hipaa_mode',
      'HIPAA settings are already configured as requested.',
      { hipaa: normalized, unchanged: true },
    );
  }

  business.settings = mergeBusinessSettings(
    settings,
    mergeBusinessHipaaSettings(settings ?? {}, normalized),
  );
  await deps.businessRepo.save(business);

  return success(
    'enable_hipaa_mode',
    `HIPAA settings updated: ${changes.join('; ')}.`,
    { hipaa: normalized, previousHipaa: current, changes },
  );
}

export async function handleExplainComplianceStatusLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainComplianceStatusFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'explain_compliance_status',
      'Ask about compliance status (e.g. "Show our GDPR compliance checklist" or "What is our HIPAA BAA status?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_compliance_status', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;
  const summary = formatComplianceStatusSummary(
    settings,
    businessType,
    parsed.aspect,
  );

  return success('explain_compliance_status', summary, {
    aspect: parsed.aspect,
    complianceStatus: formatComplianceStatusSummary(
      settings,
      businessType,
      'all',
    ),
    privacy: readBusinessPrivacySettings(settings),
    hipaa: readBusinessHipaaSettings(settings),
    businessType,
  });
}

export async function handleListSubProcessorsLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'list_sub_processors',
      'Sign in as the business owner to view data sub-processors.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseListSubProcessorsFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'list_sub_processors',
      'Ask who your data sub-processors are or to show the Article 28 processor list (e.g. "Who are our data sub-processors?" or "Show Article 28 processor list").',
      { clarify: true },
    );
  }

  await deps.businessService.ensureOwner(businessId, userId);

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('list_sub_processors', 'Business not found.');
  }

  const summary = formatSubProcessorsList(parsed.article28 === true);

  return success('list_sub_processors', summary, {
    article28: parsed.article28 === true,
    processors: SUB_PROCESSORS,
    processorCount: SUB_PROCESSORS.length,
  });
}

export async function handleExplainGdprChecklistLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'explain_gdpr_checklist',
      'Sign in as the business owner to review the GDPR checklist.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainGdprChecklistFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'explain_gdpr_checklist',
      'Ask whether you are GDPR compliant or what privacy items are missing (e.g. "Are we GDPR compliant?" or "What privacy items are still missing?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  await deps.businessService.ensureOwner(businessId, userId);

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_gdpr_checklist', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const status = buildComplianceStatusSummary(settings);
  const missing = collectGdprMissingItems(settings);
  const summary = formatGdprChecklistSummary(settings, parsed.aspect);

  return success('explain_gdpr_checklist', summary, {
    aspect: parsed.aspect,
    gdpr: status.gdpr,
    missingItems: missing,
    fullyConfigured: missing.length === 0,
    privacy: readBusinessPrivacySettings(settings),
  });
}

export async function handleAdminDeleteCustomerDataLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseAdminDeleteCustomerDataFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'admin_delete_customer_data',
      'Specify which customer to forget (e.g. "Forget this customer Anna" or "Anonymize PII from Anna\'s customer profile").',
      { clarify: true, missing: ['customerName'] },
    );
  }

  const customerName =
    parsed.customerName ??
    (typeof params.customerName === 'string' ? params.customerName.trim() : '');
  if (!customerName) {
    return failure(
      'admin_delete_customer_data',
      'Which customer should be forgotten? Say e.g. "Forget this customer Anna".',
      { clarify: true, missing: ['customerName'] },
    );
  }

  const customers = await deps.customerRepo.find({
    where: { businessId, isActive: true },
  });
  const customerId =
    typeof params.customerId === 'string' ? params.customerId : undefined;
  const customer =
    (customerId
      ? customers.find((item) => item.id === customerId)
      : undefined) ?? resolveCustomerByName(customers, customerName);

  if (!customer) {
    return failure(
      'admin_delete_customer_data',
      `No active customer found matching "${customerName}".`,
      { clarify: true, missing: ['customerName'] },
    );
  }

  await deps.customerPrivacyService.deleteCustomerData(businessId, customer.id);

  return success(
    'admin_delete_customer_data',
    `Anonymized personal data for ${customer.name} (GDPR right to erasure).`,
    { customerId: customer.id, customerName: customer.name },
  );
}

function formatCookieBannerExplanation(
  publicPrivacy: PublicBusinessPrivacySettings,
): string {
  if (publicPrivacy.cookieBannerEnabled) {
    const messageSuffix = publicPrivacy.cookieBannerMessage
      ? ` Message shown: "${publicPrivacy.cookieBannerMessage}".`
      : '';
    return `This booking page shows a cookie consent banner when you first visit.${messageSuffix} It lets you accept or manage cookies used for basic site functionality.`;
  }
  return 'This booking page does not currently show a cookie consent banner.';
}

function formatDataRightsAspectSummary(
  aspect: DataRightsAspect,
  publicPrivacy: PublicBusinessPrivacySettings,
): string {
  const exportExplanation =
    'To export your personal data, sign in to your account and ask to export your data (or use Privacy settings). We provide a JSON export of your profile, bookings, and related account information.';
  const deleteExplanation =
    'To delete your account data, sign in and request account deletion. This anonymizes your personal information (name, email, phone) under GDPR right to erasure. Booking history may be retained in anonymized form per the salon retention policy.';
  const cookieExplanation = formatCookieBannerExplanation(publicPrivacy);

  switch (aspect) {
    case 'export':
      return exportExplanation;
    case 'delete':
      return deleteExplanation;
    case 'cookie_banner':
      return cookieExplanation;
    default:
      return [exportExplanation, deleteExplanation, cookieExplanation].join(
        ' ',
      );
  }
}

export async function handleExplainDataRightsLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainDataRightsFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'explain_data_rights',
      'Ask how to export or delete your data, or about the cookie banner (e.g. "How can I export my personal data?" or "Why do I see a cookie banner?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_data_rights', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const privacy = readBusinessPrivacySettings(settings);
  const publicPrivacy = toPublicBusinessPrivacySettings(privacy);
  const summary = formatDataRightsAspectSummary(parsed.aspect, publicPrivacy);

  return success('explain_data_rights', summary, {
    aspect: parsed.aspect,
    publicPrivacy,
    privacyPolicyVersion: publicPrivacy.privacyPolicyVersion,
    ...(buildExplainDataRightsNavigate(parsed.aspect)
      ? { navigate: buildExplainDataRightsNavigate(parsed.aspect) }
      : {}),
  });
}

export async function handleReportDataBreachLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'report_data_breach',
      'Sign in as the business owner to report a data breach.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseReportDataBreachFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'report_data_breach',
      'Describe the data breach or security incident (at least 10 characters), e.g. "Report a data breach: unauthorized access to customer emails".',
      { clarify: true, missing: ['description'] },
    );
  }

  const incident = await deps.complianceBreachService.reportBreach(
    businessId,
    userId,
    {
      description: parsed.description,
      affectedCustomerCount: parsed.affectedCustomerCount,
    },
  );

  const deadline = incident.gdprNotificationDeadlineAt.toISOString();
  const countLabel =
    incident.affectedCustomerCount > 0
      ? `${incident.affectedCustomerCount} affected customer(s). `
      : '';

  return success(
    'report_data_breach',
    `Data breach incident logged (${incident.id}). ${countLabel}GDPR notification deadline: ${deadline}. A draft customer notification email has been saved.`,
    {
      incidentId: incident.id,
      affectedCustomerCount: incident.affectedCustomerCount,
      gdprNotificationDeadlineAt: deadline,
      draftEmailSubject: incident.draftEmailSubject,
      status: incident.status,
    },
  );
}

function formatBreachIncidentLine(incident: {
  id: string;
  status: string;
  reportedAt: Date;
  gdprNotificationDeadlineAt: Date;
  description: string;
  affectedCustomerCount: number;
  gdprDeadlineApproaching: boolean;
  gdprDeadlineOverdue: boolean;
}): string {
  const deadlineStatus = incident.gdprDeadlineOverdue
    ? 'deadline overdue'
    : incident.gdprDeadlineApproaching
      ? 'deadline within 24h'
      : 'deadline on track';
  const snippet = incident.description.trim().slice(0, 80);
  return `${incident.id.slice(0, 8)}… ${incident.status} — reported ${incident.reportedAt.toISOString()} — GDPR ${GDPR_BREACH_NOTIFICATION_HOURS}h deadline ${incident.gdprNotificationDeadlineAt.toISOString()} (${deadlineStatus}) — ${snippet}`;
}

function formatBreachIncidentsSummary(
  incidents: Array<{
    id: string;
    status: string;
    reportedAt: Date;
    gdprNotificationDeadlineAt: Date;
    description: string;
    affectedCustomerCount: number;
    gdprDeadlineApproaching: boolean;
    gdprDeadlineOverdue: boolean;
  }>,
  aspect: 'all' | 'deadlines',
): string {
  if (incidents.length === 0) {
    return `No data breach incidents are logged. Under GDPR, you must notify the supervisory authority within ${GDPR_BREACH_NOTIFICATION_HOURS} hours of becoming aware of a personal-data breach when required.`;
  }

  if (aspect === 'deadlines') {
    const open = incidents.filter((item) => item.status === 'open');
    if (open.length === 0) {
      return `No open breach incidents. GDPR requires supervisory-authority notification within ${GDPR_BREACH_NOTIFICATION_HOURS} hours when a notifiable breach occurs.`;
    }
    return `Open breach GDPR ${GDPR_BREACH_NOTIFICATION_HOURS}-hour deadlines: ${open.map(formatBreachIncidentLine).join('; ')}.`;
  }

  return `${incidents.length} breach incident(s): ${incidents.map(formatBreachIncidentLine).join('; ')}.`;
}

function filterPhiAccessAuditItems(
  items: PhiAccessAuditLog[],
  daysBack?: number,
  fieldName?: string,
): PhiAccessAuditLog[] {
  let filtered = items;
  if (daysBack != null) {
    const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((item) => item.createdAt.getTime() >= cutoff);
  }
  if (fieldName) {
    filtered = filtered.filter((item) => item.fieldName === fieldName);
  }
  return filtered;
}

function formatPhiAccessAuditLine(item: PhiAccessAuditLog): string {
  const who = item.userId ? `user ${item.userId.slice(0, 8)}…` : 'system';
  const field = item.fieldName
    ? ` ${formatPhiAccessAuditFieldLabel(item.fieldName)}`
    : '';
  const resource =
    item.resourceType === 'clinic_test_result'
      ? 'lab result'
      : item.resourceType === 'clinic_test_result_measurement'
        ? 'lab measurement'
        : item.resourceType;
  return `${item.createdAt.toISOString()} — ${who} (${item.role}) ${item.action} ${resource}/${item.resourceId}${field}`;
}

export async function handleSendBreachNotificationLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'send_breach_notification',
      'Sign in as the business owner to send breach notification emails.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseSendBreachNotificationFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'send_breach_notification',
      'Specify which breach incident to notify (e.g. "Email affected customers about breach BR-42" or "Send draft breach notice for incident X").',
      { clarify: true, missing: ['incidentRef'] },
    );
  }

  const outcome = await deps.complianceBreachService.sendBreachNotification(
    businessId,
    userId,
    parsed.incidentRef,
  );

  if (!outcome.ok) {
    if (outcome.reason === 'not_found') {
      return failure(
        'send_breach_notification',
        `No breach incident found matching "${parsed.incidentRef}". List incidents first or use the incident UUID prefix.`,
        { incidentRef: parsed.incidentRef, notFound: true },
      );
    }
    if (outcome.reason === 'closed') {
      return failure(
        'send_breach_notification',
        'That breach incident is closed — customer notifications cannot be sent.',
        { incidentRef: parsed.incidentRef, closed: true },
      );
    }
    return failure(
      'send_breach_notification',
      'No active customers with email addresses are on file to notify.',
      { incidentRef: parsed.incidentRef, noRecipients: true },
    );
  }

  const incidentLabel = outcome.incident.id.slice(0, 8);
  const resentLabel = outcome.resent ? ' (resent)' : '';
  const failedLabel =
    outcome.emailsFailed > 0
      ? ` ${outcome.emailsFailed} email(s) failed to send.`
      : '';
  const skippedLabel =
    outcome.recipientsSkipped > 0
      ? ` Skipped ${outcome.recipientsSkipped} customer(s) without email.`
      : '';

  return success(
    'send_breach_notification',
    `Breach notification${resentLabel} sent for incident ${incidentLabel}… — ${outcome.emailsSent} customer email(s) delivered using the saved draft.${failedLabel}${skippedLabel}`,
    {
      incidentId: outcome.incident.id,
      incidentRef: parsed.incidentRef,
      emailsSent: outcome.emailsSent,
      emailsFailed: outcome.emailsFailed,
      recipientsSkipped: outcome.recipientsSkipped,
      resent: outcome.resent,
      status: outcome.incident.status,
      draftEmailSubject: outcome.incident.draftEmailSubject,
    },
  );
}

export async function handleListBreachIncidentsLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'list_breach_incidents',
      'Sign in as the business owner to view breach incidents.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseListBreachIncidentsFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'list_breach_incidents',
      'Ask to show breach incidents or GDPR 72-hour deadlines (e.g. "Show breach incidents" or "What is our GDPR 72-hour deadline?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const incidents = await deps.complianceBreachService.listIncidents(
    businessId,
    userId,
  );

  return success(
    'list_breach_incidents',
    formatBreachIncidentsSummary(incidents, parsed.aspect),
    {
      aspect: parsed.aspect,
      incidentCount: incidents.length,
      incidents,
    },
  );
}

export async function handleViewPhiAccessAuditLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'view_phi_access_audit',
      'Sign in as the business owner to view the HIPAA PHI access audit log.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseViewPhiAccessAuditFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'view_phi_access_audit',
      'Ask who accessed patient notes or to show the HIPAA PHI audit log (e.g. "Who accessed patient notes?" or "Show HIPAA PHI audit log for last week").',
      { clarify: true },
    );
  }

  await deps.businessService.ensureOwner(businessId, userId);

  const limit = parsed.limit ?? (parsed.daysBack != null ? 200 : 50);
  const { items, total } = await deps.phiAccessAuditService.listForOwner(
    businessId,
    { limit },
  );
  const filtered = filterPhiAccessAuditItems(
    items,
    parsed.daysBack,
    parsed.fieldName,
  );

  if (filtered.length === 0) {
    const rangeLabel =
      parsed.daysBack != null ? ` in the last ${parsed.daysBack} day(s)` : '';
    const fieldLabel = parsed.fieldName
      ? ` for ${formatPhiAccessAuditFieldLabel(parsed.fieldName)}`
      : '';
    return success(
      'view_phi_access_audit',
      `No HIPAA PHI access audit entries found${rangeLabel}${fieldLabel}.`,
      {
        daysBack: parsed.daysBack,
        fieldName: parsed.fieldName,
        total,
        items: [],
      },
    );
  }

  const summary = `Showing ${filtered.length} PHI access audit entr${filtered.length === 1 ? 'y' : 'ies'}${parsed.daysBack != null ? ` from the last ${parsed.daysBack} day(s)` : ''}${parsed.fieldName ? ` for ${formatPhiAccessAuditFieldLabel(parsed.fieldName)}` : ''}: ${filtered.slice(0, 10).map(formatPhiAccessAuditLine).join('; ')}${filtered.length > 10 ? `; …and ${filtered.length - 10} more` : ''}.`;

  return success('view_phi_access_audit', summary, {
    daysBack: parsed.daysBack,
    fieldName: parsed.fieldName,
    total,
    itemCount: filtered.length,
    items: filtered,
  });
}

function formatPhiFieldLabel(fieldName: string): string {
  return formatPhiAccessAuditFieldLabel(fieldName);
}

function formatPhiEncryptionFieldSummary(
  fieldName: string,
  encryptionConfigured: boolean,
  hipaaEnabled: boolean,
): string {
  const label = formatPhiFieldLabel(fieldName);
  if (!hipaaEnabled) {
    return `${label} are not encrypted at rest because HIPAA mode is disabled.`;
  }
  if (!encryptionConfigured) {
    return `${label} encryption keys are not configured yet — PHI is stored in plaintext until HIPAA encryption is provisioned.`;
  }
  return `${label} are encrypted at rest with per-business AES keys (${PHI_ENCRYPTED_PREFIX} prefix) when HIPAA mode is active.`;
}

function formatPhiEncryptionSummary(
  status: ReturnType<typeof buildComplianceStatusSummary>,
  hipaa: ReturnType<typeof readBusinessHipaaSettings>,
  fieldName?: string,
): string {
  if (!status.hipaa.eligible) {
    return 'PHI encryption at rest is only available for clinic businesses with HIPAA mode enabled.';
  }

  if (fieldName) {
    return formatPhiEncryptionFieldSummary(
      fieldName,
      status.hipaa.phiEncryptionConfigured,
      status.hipaa.enabled,
    );
  }

  const keyId = hipaa.phiEncryptionKeyId
    ? `key ${hipaa.phiEncryptionKeyId}`
    : 'no key';
  const state = status.hipaa.phiEncryptionConfigured
    ? `configured (${keyId})`
    : 'not configured';
  const fields = PHI_FIELD_NAMES.map((field) =>
    formatPhiFieldLabel(field),
  ).join(', ');

  if (!status.hipaa.enabled) {
    return `HIPAA mode is disabled, so PHI encryption at rest is off. When enabled, these fields are encrypted: ${fields}.`;
  }

  return `HIPAA PHI encryption is ${state}. Protected fields at rest: ${fields}. Values use the ${PHI_ENCRYPTED_PREFIX} envelope when encrypted.`;
}

function formatMinimumNecessaryAspectSummary(
  aspect: 'all' | 'roles' | 'fields',
  hipaaEnabled: boolean,
): string {
  const enforcement = hipaaEnabled
    ? 'Minimum-necessary access is enforced while HIPAA mode is on.'
    : 'Minimum-necessary masking applies when HIPAA mode is enabled.';

  const rolesSummary =
    'Owners, admins, and managers can view PHI on any booking. Staff and contributors only see PHI on bookings assigned to them (primary provider or linked staff).';
  const fieldsSummary = `PHI fields covered: ${PHI_FIELD_NAMES.map((field) => formatPhiFieldLabel(field)).join(', ')}. Unassigned bookings mask these fields for staff.`;

  switch (aspect) {
    case 'roles':
      return `${rolesSummary} ${enforcement}`;
    case 'fields':
      return `${fieldsSummary} ${enforcement}`;
    default:
      return `${rolesSummary} ${fieldsSummary} ${enforcement}`;
  }
}

export async function handleExplainPhiEncryptionStatusLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainPhiEncryptionStatusFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'explain_phi_encryption_status',
      'Ask whether HIPAA PHI encryption is enabled or if specific fields are encrypted at rest (e.g. "Is HIPAA encryption on?" or "Are referral notes encrypted at rest?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_phi_encryption_status', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;

  if (!isHipaaEligibleBusinessType(businessType)) {
    return failure(
      'explain_phi_encryption_status',
      'PHI encryption status is only available for clinic businesses.',
      { clinicOnly: true },
    );
  }

  const hipaa = readBusinessHipaaSettings(settings);
  const status = buildComplianceStatusSummary(settings, businessType);
  const summary = formatPhiEncryptionSummary(status, hipaa, parsed.fieldName);

  return success('explain_phi_encryption_status', summary, {
    fieldName: parsed.fieldName,
    hipaaEligible: status.hipaa.eligible,
    hipaaEnabled: status.hipaa.enabled,
    phiEncryptionConfigured: status.hipaa.phiEncryptionConfigured,
    phiEncryptionKeyId: hipaa.phiEncryptionKeyId,
  });
}

export async function handleExplainMinimumNecessaryPhiAccessLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainMinimumNecessaryPhiAccessFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'explain_minimum_necessary_phi_access',
      'Ask who can see patient notes or what PHI staff can access (e.g. "Who can see patient notes?" or "What PHI can staff access?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure(
      'explain_minimum_necessary_phi_access',
      'Business not found.',
    );
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;
  const status = buildComplianceStatusSummary(settings, businessType);
  const summary = formatMinimumNecessaryAspectSummary(
    parsed.aspect,
    status.hipaa.enabled,
  );

  return success('explain_minimum_necessary_phi_access', summary, {
    aspect: parsed.aspect,
    hipaaEnabled: status.hipaa.enabled,
    minimumAccessEnforced: status.hipaa.minimumAccessEnforced,
    phiFields: [...PHI_FIELD_NAMES],
    fullAccessRoles: ['owner', 'admin', 'manager'],
    limitedAccessRoles: ['staff', 'contributor'],
  });
}

function formatHipaaSessionTimeoutSummary(
  status: ReturnType<typeof buildComplianceStatusSummary>,
  personalLogout: boolean,
): string {
  const minutes = status.hipaa.sessionTimeoutMinutes;
  const enforced = status.hipaa.sessionTimeoutEnforced;

  if (!status.hipaa.eligible) {
    return 'HIPAA session timeout applies only to clinic businesses.';
  }

  if (!enforced) {
    const base = `HIPAA mode is off, so the ${minutes}-minute session timeout is not enforced yet.`;
    if (personalLogout) {
      return `${base} Auto-logout after inactivity starts once HIPAA safeguards are enabled.`;
    }
    return base;
  }

  if (personalLogout) {
    return `You will be logged out automatically after ${minutes} minutes of inactivity while HIPAA mode is on. The exact time depends on your last activity in this session.`;
  }

  return `HIPAA session timeout is ${minutes} minutes. Auto-logout after inactivity is enforced while HIPAA mode is enabled.`;
}

export async function handleExplainHipaaSessionTimeoutLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainHipaaSessionTimeoutFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'explain_hipaa_session_timeout',
      'Ask when you will be logged out or what the HIPAA session timeout is (e.g. "When will I be logged out?" or "What is our HIPAA session timeout?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_hipaa_session_timeout', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;

  if (!isHipaaEligibleBusinessType(businessType)) {
    return failure(
      'explain_hipaa_session_timeout',
      'HIPAA session timeout is only available for clinic businesses.',
      { clinicOnly: true },
    );
  }

  const status = buildComplianceStatusSummary(settings, businessType);
  const summary = formatHipaaSessionTimeoutSummary(
    status,
    parsed.personalLogout === true,
  );

  return success('explain_hipaa_session_timeout', summary, {
    personalLogout: parsed.personalLogout === true,
    sessionTimeoutMinutes: status.hipaa.sessionTimeoutMinutes,
    sessionTimeoutEnforced: status.hipaa.sessionTimeoutEnforced,
    hipaaEnabled: status.hipaa.enabled,
    hipaaEligible: status.hipaa.eligible,
  });
}

function formatProviderSessionTimeoutSummary(
  status: ReturnType<typeof buildComplianceStatusSummary>,
  personalLogout: boolean,
): string {
  const minutes = status.hipaa.sessionTimeoutMinutes;
  const enforced = status.hipaa.sessionTimeoutEnforced;

  if (!status.hipaa.eligible) {
    return 'HIPAA session timeout applies only to clinic businesses.';
  }

  if (!enforced) {
    const base = `HIPAA mode is off, so the ${minutes}-minute session timeout is not enforced in the provider mobile app yet.`;
    if (personalLogout) {
      return `${base} Auto-logout after inactivity starts once HIPAA safeguards are enabled.`;
    }
    return base;
  }

  if (personalLogout) {
    return `The provider mobile app will log you out automatically after ${minutes} minutes of inactivity while HIPAA mode is on. The exact time depends on your last activity in this session.`;
  }

  return `Provider app HIPAA session timeout is ${minutes} minutes. Auto-logout after inactivity is enforced while HIPAA mode is enabled.`;
}

export async function handleExplainProviderSessionTimeoutLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_provider_session_timeout', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;

  if (!isHipaaEligibleBusinessType(businessType)) {
    return failure(
      'explain_provider_session_timeout',
      'HIPAA session timeout is only available for clinic businesses.',
      { clinicOnly: true },
    );
  }

  const status = buildComplianceStatusSummary(settings, businessType);
  const summary = formatProviderSessionTimeoutSummary(status, true);

  return success('explain_provider_session_timeout', summary, {
    personalLogout: true,
    sessionTimeoutMinutes: status.hipaa.sessionTimeoutMinutes,
    sessionTimeoutEnforced: status.hipaa.sessionTimeoutEnforced,
    hipaaEnabled: status.hipaa.enabled,
    hipaaEligible: status.hipaa.eligible,
    providerApp: true,
    compliance113ProviderDeferred: true,
  });
}

export async function handleOpenComplianceDashboardLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'open_compliance_dashboard',
      'Sign in as the business owner to open compliance settings.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseOpenComplianceDashboardFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'open_compliance_dashboard',
      'Ask to open compliance settings or a compliance panel (e.g. "Open compliance settings" or "Take me to breach log").',
      { clarify: true, missing: ['panel'] },
    );
  }

  await deps.businessService.ensureOwner(businessId, userId);

  const navigate = buildComplianceDashboardNavigate(parsed.panel);
  const panelLabel = compliancePanelLabel(parsed.panel);

  return success(
    'open_compliance_dashboard',
    `Opening Settings → Compliance (${panelLabel}). Use the link below if you are not redirected automatically.`,
    {
      panel: parsed.panel,
      navigate,
      compliance116DedicatedPageDeferred: true,
      deepLinkIntoSettings: true,
    },
  );
}

export async function handleAcceptHipaaBaaLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'accept_hipaa_baa',
      'Sign in as the business owner to accept the HIPAA Business Associate Agreement.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseAcceptHipaaBaaFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'accept_hipaa_baa',
      'Ask to accept or sign the HIPAA Business Associate Agreement (e.g. "Accept the HIPAA business associate agreement" or "Sign BAA to enable HIPAA mode").',
      { clarify: true },
    );
  }

  await deps.businessService.ensureOwner(businessId, userId);

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('accept_hipaa_baa', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;

  if (!isHipaaEligibleBusinessType(businessType)) {
    return failure(
      'accept_hipaa_baa',
      'HIPAA BAA acceptance is only available for clinic businesses.',
      { clinicOnly: true },
    );
  }

  const current = readBusinessHipaaSettings(settings);
  const acceptedAt = new Date().toISOString();
  const nextInput = {
    ...current,
    baaAcceptedAt: current.baaAcceptedAt ?? acceptedAt,
    baaAcceptedByUserId: current.baaAcceptedByUserId ?? userId,
    baaVersion: current.baaVersion ?? DEFAULT_HIPAA_BAA_VERSION,
    ...(parsed.enableHipaa ? { enabled: true } : {}),
  };

  let normalized;
  try {
    normalized = assertBusinessHipaaSettings(nextInput, businessType, settings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid HIPAA settings';
    return failure('accept_hipaa_baa', message);
  }

  const baaNewlySigned = !current.baaAcceptedAt;
  const hipaaEnabled =
    parsed.enableHipaa && !current.enabled && normalized.enabled;

  if (!baaNewlySigned && !hipaaEnabled) {
    return success(
      'accept_hipaa_baa',
      'HIPAA Business Associate Agreement is already accepted.',
      { hipaa: normalized, unchanged: true, baaSigned: true },
    );
  }

  business.settings = mergeBusinessSettings(
    settings,
    mergeBusinessHipaaSettings(settings ?? {}, normalized),
  );
  await deps.businessRepo.save(business);

  const parts: string[] = [];
  if (baaNewlySigned) {
    parts.push('HIPAA Business Associate Agreement accepted');
  }
  if (hipaaEnabled) {
    parts.push('HIPAA safeguards enabled');
  }

  return success(
    'accept_hipaa_baa',
    parts.length > 0
      ? `${parts.join(' and ')}.`
      : 'HIPAA Business Associate Agreement accepted.',
    {
      hipaa: normalized,
      previousHipaa: current,
      baaSigned: true,
      baaNewlySigned,
      hipaaEnabled,
    },
  );
}

export async function handleExplainEnterpriseTrustLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'explain_enterprise_trust',
      'Sign in as the business owner to view enterprise trust information.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainEnterpriseTrustFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'explain_enterprise_trust',
      'Ask about enterprise trust settings, DPA/privacy-policy documents, or the security one-pager (e.g. "What is our enterprise trust status?" or "Show our DPA").',
      { clarify: true },
    );
  }

  const settings = await deps.enterpriseTrustService.getSettings(businessId);

  if (parsed.aspect === 'documents') {
    const documents = await deps.enterpriseTrustService.renderDocuments(
      businessId,
    );
    return success(
      'explain_enterprise_trust',
      `${documents.length} trust document(s) available: ${documents
        .map((d) => d.title)
        .join(', ')}.`,
      { aspect: 'documents', documents, settings },
    );
  }

  if (parsed.aspect === 'security') {
    const onePager = deps.enterpriseTrustService.getSecurityOnePager();
    return success(
      'explain_enterprise_trust',
      `Security one-pager "${onePager.title}" — ${onePager.summary}`,
      { aspect: 'security', securityOnePager: onePager },
    );
  }

  const configuredFields = Object.entries(settings).filter(
    ([, v]) => v != null && v !== '',
  ).length;
  const totalFields = Object.keys(settings).length;
  return success(
    'explain_enterprise_trust',
    `Enterprise trust settings: ${configuredFields}/${totalFields} fields configured (legal business name, registered address, DPO email, EU representative, etc.).`,
    { aspect: 'settings', settings },
  );
}

export async function handleExplainStrategyEvalLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'explain_strategy_eval',
      'Sign in as the business owner to view the strategy evaluation.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseExplainStrategyEvalFromPrompt(effectivePrompt, params);
  if (!parsed) {
    return failure(
      'explain_strategy_eval',
      'Ask about our HIPAA readiness decision or marketplace positioning decision (e.g. "What is our HIPAA decision?" or "Show our marketplace positioning eval").',
      { clarify: true },
    );
  }

  const summary = await deps.strategyEvalService.getSummary(businessId);

  if (parsed.aspect === 'hipaa') {
    return success(
      'explain_strategy_eval',
      summary.hipaa
        ? `HIPAA decision: ${summary.hipaa.recommendation} (readiness ${summary.hipaa.readinessPercent}%, ${summary.hipaa.blockers.length} blocker(s)).`
        : 'No HIPAA readiness evaluation has been submitted yet.',
      { aspect: 'hipaa', hipaa: summary.hipaa },
    );
  }

  if (parsed.aspect === 'marketplace') {
    return success(
      'explain_strategy_eval',
      summary.marketplace
        ? `Marketplace positioning decision: ${summary.marketplace.recommendation}.`
        : 'No marketplace positioning evaluation has been submitted yet.',
      { aspect: 'marketplace', marketplace: summary.marketplace },
    );
  }

  const parts: string[] = [];
  parts.push(
    summary.hipaa
      ? `HIPAA: ${summary.hipaa.recommendation}`
      : 'HIPAA: not evaluated',
  );
  parts.push(
    summary.marketplace
      ? `marketplace: ${summary.marketplace.recommendation}`
      : 'marketplace: not evaluated',
  );
  return success('explain_strategy_eval', parts.join('; ') + '.', {
    aspect: 'all',
    summary,
  });
}

export async function handleUpdateStrategyEvalLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  userId: string | undefined,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'update_strategy_eval',
      'Sign in as the business owner to submit a strategy evaluation.',
      { clarify: true },
    );
  }

  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const evalType =
    typeof params.evalType === 'string' ? params.evalType : undefined;

  if (evalType !== 'hipaa' && evalType !== 'marketplace') {
    if (!isUpdateStrategyEvalPrompt(effectivePrompt)) {
      return failure(
        'update_strategy_eval',
        'Ask to submit or update the HIPAA readiness decision or marketplace positioning decision, with evalType set to "hipaa" or "marketplace".',
        { clarify: true, missing: ['evalType'] },
      );
    }
    return failure(
      'update_strategy_eval',
      'Specify evalType: "hipaa" (with answers) or "marketplace" (with criterionWeights).',
      { clarify: true, missing: ['evalType'] },
    );
  }

  await deps.businessService.ensureOwner(businessId, userId);

  if (evalType === 'hipaa') {
    const answers = params.answers as Record<string, any> | undefined;
    if (!answers || typeof answers !== 'object') {
      return failure(
        'update_strategy_eval',
        'Provide answers for the HIPAA readiness checklist (an object mapping checklist item ids to "yes"/"no"/"unsure").',
        { clarify: true, missing: ['answers'] },
      );
    }
    const decision =
      typeof params.decision === 'string'
        ? (params.decision as 'defer' | 'wellness_only' | 'pursue_baa')
        : undefined;
    try {
      const result = await deps.strategyEvalService.submitHipaaEval(
        businessId,
        {
          answers,
          notes: typeof params.notes === 'string' ? params.notes : undefined,
          decision,
        },
      );
      return success(
        'update_strategy_eval',
        `HIPAA readiness evaluation saved — recommendation: ${result.recommendation}.`,
        { evalType: 'hipaa', hipaa: result },
      );
    } catch (err: any) {
      return failure(
        'update_strategy_eval',
        err?.message ?? 'Could not save the HIPAA evaluation.',
      );
    }
  }

  const criterionWeights = params.criterionWeights as
    | Record<string, number>
    | undefined;
  if (!criterionWeights || typeof criterionWeights !== 'object') {
    return failure(
      'update_strategy_eval',
      'Provide criterionWeights for the marketplace positioning evaluation (an object mapping criterion ids to a weight).',
      { clarify: true, missing: ['criterionWeights'] },
    );
  }
  const decision =
    typeof params.decision === 'string'
      ? (params.decision as
          | 'software_only'
          | 'partner_directory'
          | 'full_marketplace'
          | 'undecided')
      : undefined;
  try {
    const result = await deps.strategyEvalService.submitMarketplaceEval(
      businessId,
      {
        criterionWeights,
        directoryOptIn:
          typeof params.directoryOptIn === 'boolean'
            ? params.directoryOptIn
            : undefined,
        notes: typeof params.notes === 'string' ? params.notes : undefined,
        decision,
      },
    );
    return success(
      'update_strategy_eval',
      `Marketplace positioning evaluation saved — recommendation: ${result.recommendation}.`,
      { evalType: 'marketplace', marketplace: result },
    );
  } catch (err: any) {
    return failure(
      'update_strategy_eval',
      err?.message ?? 'Could not save the marketplace evaluation.',
    );
  }
}

export async function handleConfigureHipaaSessionTimeoutLogic(
  deps: BusinessComplianceLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureHipaaSessionTimeoutFromPrompt(
    effectivePrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'configure_hipaa_session_timeout',
      'Specify a HIPAA session timeout in minutes (e.g. "Set HIPAA timeout to 10 minutes" or "Require 15-minute auto logout").',
      { clarify: true, missing: ['sessionTimeoutMinutes'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('configure_hipaa_session_timeout', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const businessType =
    typeof settings?.businessType === 'string' ? settings.businessType : null;

  if (!isHipaaEligibleBusinessType(businessType)) {
    return failure(
      'configure_hipaa_session_timeout',
      'HIPAA session timeout is only available for clinic businesses.',
      { clinicOnly: true },
    );
  }

  const current = readBusinessHipaaSettings(settings);
  const nextInput = {
    ...current,
    sessionTimeoutMinutes: parsed.sessionTimeoutMinutes,
  };

  let normalized;
  try {
    normalized = assertBusinessHipaaSettings(nextInput, businessType, settings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid HIPAA settings';
    return failure('configure_hipaa_session_timeout', message);
  }

  if (current.sessionTimeoutMinutes === normalized.sessionTimeoutMinutes) {
    return success(
      'configure_hipaa_session_timeout',
      `HIPAA session timeout is already set to ${normalized.sessionTimeoutMinutes} minutes.`,
      { hipaa: normalized, unchanged: true },
    );
  }

  business.settings = mergeBusinessSettings(
    settings,
    mergeBusinessHipaaSettings(settings ?? {}, normalized),
  );
  await deps.businessRepo.save(business);

  return success(
    'configure_hipaa_session_timeout',
    `HIPAA session timeout updated: ${current.sessionTimeoutMinutes} → ${normalized.sessionTimeoutMinutes} minutes.`,
    {
      hipaa: normalized,
      previousHipaa: current,
      sessionTimeoutMinutes: normalized.sessionTimeoutMinutes,
    },
  );
}
