import { Repository } from 'typeorm';
import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import type { StripeIntegrationPublicView } from '../billing/stripe-integration.types.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import type { PlanTierId } from '../billing/plan-limits.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import type {
  CommandResult,
  GuideResponse,
} from './command-completion.types.js';
import type { AccessTier } from './access-control.matrix.js';
import {
  DASHBOARD_DENIED_BY_TIER,
  PROVIDER_DENIED_BY_TIER,
} from './access-control.matrix.js';
import {
  buildGuideFlowListContextFromInput,
  describeGuidePlaybookGate,
  findGuideFlowPlaybookByTopicId,
} from './ai-product-guide-plan-gate.util.js';
import {
  isGuideFlowPlaybookEntitlementAllowed,
  isGuideFlowPlaybookRoleVerticalVisible,
  resolveActiveGuideVerticalOverlays,
} from './guide/guide-flow.merge.util.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import type { ProductGuideLogicInput } from './ai-product-guide.logic.js';
import {
  EMPTY_STATE_GUIDE_PIPE_MARKER,
  type EmptyStateGuideIntent,
} from './ai-product-guide-empty-state.fixtures.js';

export interface EmptyStateGuideLogicDeps {
  businessRepo: Repository<Business>;
  serviceRepo: Repository<Service>;
  employeeRepo: Repository<Employee>;
  stripeIntegrationService: StripeIntegrationService;
}

export interface EmptyStateGuideSnapshot {
  businessName: string;
  publicBookingEnabled: boolean;
  serviceCountTotal: number;
  serviceCountActive: number;
  employeeCountTotal: number;
  employeeCountActive: number;
  stripe: StripeIntegrationPublicView;
  onlinePaymentsEnabled: boolean;
  acceptCashPayments: boolean;
  planTierId: PlanTierId;
  enabledModules?: readonly string[];
  role?: AccessTier;
  surface: GuideFlowSurface;
  linkedEmployeeServiceCount?: number;
}

export interface EmptyStateGuideContext {
  businessId: string;
  surface: GuideFlowSurface;
  locale?: string;
  prompt?: string;
  params?: Record<string, unknown>;
  route?: string;
  role?: AccessTier;
  planTierId?: PlanTierId;
  enabledModules?: readonly string[];
  linkedEmployeeId?: string;
  session?: ProductGuideLogicInput['session'];
}

function failure(
  intent: EmptyStateGuideIntent,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action: intent, summary, details };
}

function success(
  intent: EmptyStateGuideIntent,
  summary: string,
  guide: GuideResponse,
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: true,
    action: intent,
    summary,
    guide,
    details: {
      ...details,
      pipeMarker: EMPTY_STATE_GUIDE_PIPE_MARKER,
      liveSnapshot: true,
      deterministic: true,
    },
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readPlanTierId(ctx: EmptyStateGuideContext): PlanTierId {
  const raw =
    ctx.planTierId ??
    ctx.session?.context?._planTierId ??
    ctx.session?.context?.planTierId;
  if (raw === 'starter' || raw === 'business' || raw === 'solo') return raw;
  return 'solo';
}

function isPublicBookingEnabled(
  settings: Record<string, unknown> | null | undefined,
): boolean {
  const pb = settings?.publicBooking as { enabled?: boolean } | undefined;
  return pb?.enabled !== false;
}

export async function loadEmptyStateGuideSnapshot(
  deps: EmptyStateGuideLogicDeps,
  ctx: EmptyStateGuideContext,
): Promise<EmptyStateGuideSnapshot | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: ctx.businessId },
  });
  if (!business) return null;

  const [
    serviceCountTotal,
    serviceCountActive,
    employeeCountTotal,
    employeeCountActive,
    stripe,
  ] = await Promise.all([
    deps.serviceRepo.count({ where: { businessId: ctx.businessId } }),
    deps.serviceRepo.count({
      where: { businessId: ctx.businessId, isActive: true },
    }),
    deps.employeeRepo.count({ where: { businessId: ctx.businessId } }),
    deps.employeeRepo.count({
      where: { businessId: ctx.businessId, isActive: true },
    }),
    deps.stripeIntegrationService.getPublicSettings(ctx.businessId),
  ]);

  const payment = resolvePublicPaymentSettings(business.settings);
  let linkedEmployeeServiceCount: number | undefined;
  const employeeId =
    readString(ctx.linkedEmployeeId) ??
    readString(ctx.session?.context?.employeeId) ??
    readString(ctx.params?.employeeId);
  if (employeeId) {
    const employee = await deps.employeeRepo.findOne({
      where: { id: employeeId, businessId: ctx.businessId },
    });
    linkedEmployeeServiceCount = employee?.serviceIds?.length ?? 0;
  }

  return {
    businessName: business.name,
    publicBookingEnabled: isPublicBookingEnabled(business.settings),
    serviceCountTotal,
    serviceCountActive,
    employeeCountTotal,
    employeeCountActive,
    stripe,
    onlinePaymentsEnabled: Boolean(
      getBusinessStripeIntegration(business.settings).connectAccountId,
    ),
    acceptCashPayments: payment.acceptCashPayments,
    planTierId: readPlanTierId(ctx),
    enabledModules: ctx.enabledModules,
    role: ctx.role,
    surface: ctx.surface,
    linkedEmployeeServiceCount,
  };
}

function extractVisibilitySubject(
  prompt: string,
  params: Record<string, unknown> = {},
): string {
  const explicit =
    readString(params.featureName) ??
    readString(params.subject) ??
    readString(params.topicId);
  if (explicit) return explicit;

  const quoted = prompt.match(/["']([^"']+)["']/);
  if (quoted?.[1]) return quoted[1].trim();

  const match =
    prompt.match(
      /(?:why\s+(?:can(?:'|no)?t|don(?:'|no)?t)\s+i\s+see|can(?:'|no)?t\s+see|missing)\s+(?:the\s+)?(.+?)(?:\?|$|on\s+my)/i,
    ) ?? prompt.match(/no\s+access\s+to\s+(?:the\s+)?(.+?)(?:\?|$)/i);
  return match?.[1]?.trim() || 'this feature';
}

function buildNavigate(
  path: string,
  label?: string,
): GuideResponse['navigate'] {
  return { path, ...(label ? { label } : {}) };
}

function buildEmptyStateGuideResponse(input: {
  topicId: string;
  summary: string;
  steps: GuideResponse['steps'];
  navigate?: GuideResponse['navigate'];
}): GuideResponse {
  return {
    topicId: input.topicId,
    summary: input.summary,
    voiceSummary: input.summary,
    steps: input.steps,
    navigate: input.navigate,
    sources: [{ topicId: input.topicId, label: input.summary, kind: 'static' }],
  };
}

function describeStripeConnectStatus(
  snapshot: EmptyStateGuideSnapshot,
  locale: AppLocale,
): {
  summary: string;
  steps: GuideResponse['steps'];
  navigate: GuideResponse['navigate'];
} {
  const { stripe, acceptCashPayments } = snapshot;
  const settingsPath = '/dashboard/settings/integrations';
  const navigate = buildNavigate(settingsPath, 'Open Integrations');

  if (!stripe.connectAccountId) {
    const summary =
      locale === 'hy'
        ? 'Stripe Connect դեռ չի միացված — առցանց քարտային վճարումները անհասանելի են։'
        : locale === 'ru'
          ? 'Stripe Connect ещё не подключён — онлайн-оплата картой недоступна.'
          : 'Stripe Connect is not linked yet — online card payments are unavailable.';
    return {
      summary,
      navigate,
      steps: [
        {
          title:
            locale === 'hy'
              ? 'Միացրեք Stripe'
              : locale === 'ru'
                ? 'Подключите Stripe'
                : 'Connect Stripe',
          body:
            locale === 'hy'
              ? 'Բացեք Settings → Integrations → Stripe Connect և ավարտեք OAuth կամ Express onboarding-ը։'
              : locale === 'ru'
                ? 'Откройте Settings → Integrations → Stripe Connect и завершите OAuth или Express onboarding.'
                : 'Open Settings → Integrations → Stripe Connect and complete OAuth or Express onboarding.',
          navigate,
        },
        ...(acceptCashPayments
          ? [
              {
                title:
                  locale === 'hy'
                    ? 'Վճարում տեղում'
                    : locale === 'ru'
                      ? 'Оплата на месте'
                      : 'Pay at venue',
                body:
                  locale === 'hy'
                    ? 'Մինչ Stripe-ը պատրաստ չլինի, cash / pay-at-venue ամրագրումները դեռ հասանելի են։'
                    : locale === 'ru'
                      ? 'Пока Stripe не готов, бронирования с оплатой на месте всё ещё доступны.'
                      : 'Until Stripe is ready, cash / pay-at-venue bookings can still be enabled.',
              },
            ]
          : []),
      ],
    };
  }

  if (!stripe.detailsSubmitted || !stripe.chargesEnabled) {
    const summary =
      locale === 'hy'
        ? 'Stripe Connect-ը միացված է, բայց onboarding-ը դեռ ավարտված չէ — քարտային վճարումները ակտիվ չեն։'
        : locale === 'ru'
          ? 'Stripe Connect подключён, но onboarding не завершён — приём карт пока недоступен.'
          : 'Stripe Connect is linked but onboarding is incomplete — card charges are not enabled yet.';
    return {
      summary,
      navigate,
      steps: [
        {
          title:
            locale === 'hy'
              ? 'Ավարտեք Stripe onboarding'
              : locale === 'ru'
                ? 'Завершите onboarding Stripe'
                : 'Finish Stripe onboarding',
          body:
            locale === 'hy'
              ? `Հաշիվը ${stripe.connectAccountId} — լրացրեք Stripe Dashboard-ում պահանջվող տվյալները և սպասեք chargesEnabled=true։`
              : locale === 'ru'
                ? `Аккаунт ${stripe.connectAccountId} — заполните данные в Stripe Dashboard и дождитесь chargesEnabled=true.`
                : `Account ${stripe.connectAccountId} — complete required details in the Stripe Dashboard and wait for chargesEnabled=true.`,
          navigate,
        },
      ],
    };
  }

  const summary =
    locale === 'hy'
      ? 'Stripe Connect-ը պատրաստ է — առցանց քարտային վճարումները ակտիվ են։'
      : locale === 'ru'
        ? 'Stripe Connect готов — онлайн-оплата картой активна.'
        : 'Stripe Connect is ready — online card payments are active.';
  return {
    summary,
    navigate,
    steps: [
      {
        title:
          locale === 'hy'
            ? 'Stripe պատրաստ է'
            : locale === 'ru'
              ? 'Stripe готов'
              : 'Stripe is ready',
        body: summary,
        navigate,
      },
    ],
  };
}

export async function handleExplainStripeNotConnectedLogic(
  deps: EmptyStateGuideLogicDeps,
  ctx: EmptyStateGuideContext,
): Promise<CommandResult> {
  const locale = resolveLocale(ctx.locale);
  const snapshot = await loadEmptyStateGuideSnapshot(deps, ctx);
  if (!snapshot) {
    return failure('explain_stripe_not_connected', 'Business not found.');
  }

  const described = describeStripeConnectStatus(snapshot, locale);
  const guide = buildEmptyStateGuideResponse({
    topicId: 'live.stripe-connect',
    summary: described.summary,
    steps: described.steps,
    navigate: described.navigate,
  });

  return success('explain_stripe_not_connected', described.summary, guide, {
    stripe: snapshot.stripe,
    acceptCashPayments: snapshot.acceptCashPayments,
    onlinePaymentsEnabled: snapshot.onlinePaymentsEnabled,
    retrievalPath: 'empty-state-stripe',
  });
}

export async function handleExplainEmptyCatalogLogic(
  deps: EmptyStateGuideLogicDeps,
  ctx: EmptyStateGuideContext,
): Promise<CommandResult> {
  const locale = resolveLocale(ctx.locale);
  const snapshot = await loadEmptyStateGuideSnapshot(deps, ctx);
  if (!snapshot) {
    return failure('explain_empty_catalog', 'Business not found.');
  }

  const reasons: string[] = [];
  const steps: GuideResponse['steps'] = [];
  let navigate = buildNavigate('/dashboard/services', 'Open Services');

  if (
    !snapshot.publicBookingEnabled &&
    (ctx.surface === 'public' || ctx.surface === 'customer')
  ) {
    reasons.push(
      locale === 'hy'
        ? 'Հանրային ամրագրումը (public booking) անջատված է այս սalon-ում։'
        : locale === 'ru'
          ? 'Публичное бронирование отключено для этого салона.'
          : 'Public booking is turned off for this business.',
    );
    steps.push({
      title:
        locale === 'hy'
          ? 'Միացրեք public booking'
          : locale === 'ru'
            ? 'Включите public booking'
            : 'Enable public booking',
      body:
        locale === 'hy'
          ? 'Dashboard → Settings → Public booking → Enable online booking page.'
          : locale === 'ru'
            ? 'Dashboard → Settings → Public booking → включите страницу онлайн-записи.'
            : 'Dashboard → Settings → Public booking → enable the online booking page.',
      navigate: buildNavigate('/dashboard/settings/public-booking'),
    });
    navigate = buildNavigate('/dashboard/settings/public-booking');
  }

  if (snapshot.serviceCountTotal === 0) {
    reasons.push(
      locale === 'hy'
        ? 'Կատալոգում դեռ չկա ոչ մի ծառայություն։'
        : locale === 'ru'
          ? 'В каталоге пока нет ни одной услуги.'
          : 'There are no services in the catalog yet.',
    );
    steps.push({
      title:
        locale === 'hy'
          ? 'Ավելացրեք ծառայություն'
          : locale === 'ru'
            ? 'Добавьте услугу'
            : 'Add a service',
      body:
        locale === 'hy'
          ? 'Dashboard → Services → Create service, ապա նշեք Active։'
          : locale === 'ru'
            ? 'Dashboard → Services → создайте услугу и отметьте Active.'
            : 'Dashboard → Services → create a service and mark it Active.',
      navigate: buildNavigate('/dashboard/services'),
    });
  } else if (snapshot.serviceCountActive === 0) {
    reasons.push(
      locale === 'hy'
        ? `${snapshot.serviceCountTotal} ծառայություն կա, բայց բոլորը Inactive են։`
        : locale === 'ru'
          ? `Есть ${snapshot.serviceCountTotal} услуг, но все неактивны.`
          : `${snapshot.serviceCountTotal} services exist but all are inactive.`,
    );
    steps.push({
      title:
        locale === 'hy'
          ? 'Ակտիվացրեք ծառայությունները'
          : locale === 'ru'
            ? 'Активируйте услуги'
            : 'Activate services',
      body:
        locale === 'hy'
          ? 'Dashboard → Services → բացեք ծառայությունը և միացրեք Active toggle-ը։'
          : locale === 'ru'
            ? 'Dashboard → Services → откройте услугу и включите Active.'
            : 'Dashboard → Services → open each service and turn on Active.',
      navigate: buildNavigate('/dashboard/services'),
    });
  }

  if (snapshot.employeeCountActive === 0 && ctx.surface !== 'customer') {
    reasons.push(
      locale === 'hy'
        ? 'Ակտիվ staff/provider չկա — հանրային էջը կարող է դատարկ երևալ։'
        : locale === 'ru'
          ? 'Нет активных сотрудников — публичная страница может выглядеть пустой.'
          : 'No active staff/providers — the public page may look empty.',
    );
    steps.push({
      title:
        locale === 'hy'
          ? 'Ավելացրեք staff'
          : locale === 'ru'
            ? 'Добавьте сотрудника'
            : 'Add staff',
      body:
        locale === 'hy'
          ? 'Dashboard → Team → invite or activate a provider linked to services.'
          : locale === 'ru'
            ? 'Dashboard → Team → пригласите или активируйте мастера с услугами.'
            : 'Dashboard → Team → invite or activate a provider linked to services.',
      navigate: buildNavigate('/dashboard/team'),
    });
  }

  if (
    ctx.surface === 'provider' &&
    snapshot.linkedEmployeeServiceCount === 0 &&
    snapshot.serviceCountActive > 0
  ) {
    reasons.push(
      locale === 'hy'
        ? 'Ձեր profile-ին դեռ չեն կցվել ծառայություններ։'
        : locale === 'ru'
          ? 'К вашему профилю ещё не привязаны услуги.'
          : 'No services are linked to your provider profile yet.',
    );
    steps.push({
      title:
        locale === 'hy'
          ? 'Կցեք ծառայություններ'
          : locale === 'ru'
            ? 'Привяжите услуги'
            : 'Link services',
      body:
        locale === 'hy'
          ? 'Պահանջեք manager-ից Team → Edit provider → Services, կամ ստեղծեք profile serviceIds։'
          : locale === 'ru'
            ? 'Попросите менеджера Team → Edit provider → Services или обновите serviceIds профиля.'
            : 'Ask a manager to update Team → Edit provider → Services, or refresh your profile serviceIds.',
      navigate: buildNavigate('/tabs/profile'),
    });
    navigate = buildNavigate('/tabs/profile');
  }

  if (reasons.length === 0) {
    const okSummary =
      locale === 'hy'
        ? `Կատալոգը live տվյալներով OK է — ${snapshot.serviceCountActive} ակտիվ ծառայություն, ${snapshot.employeeCountActive} ակտիվ staff։`
        : locale === 'ru'
          ? `Каталог в порядке — ${snapshot.serviceCountActive} активных услуг, ${snapshot.employeeCountActive} активных сотрудников.`
          : `Catalog looks healthy — ${snapshot.serviceCountActive} active services and ${snapshot.employeeCountActive} active staff.`;
    reasons.push(okSummary);
    steps.push({
      title:
        locale === 'hy'
          ? 'Կատալոգը OK է'
          : locale === 'ru'
            ? 'Каталог в порядке'
            : 'Catalog looks fine',
      body: okSummary,
    });
  }

  const summary = reasons.join(' ');
  const guide = buildEmptyStateGuideResponse({
    topicId: 'live.catalog-empty-state',
    summary,
    steps,
    navigate,
  });

  return success('explain_empty_catalog', summary, guide, {
    serviceCountTotal: snapshot.serviceCountTotal,
    serviceCountActive: snapshot.serviceCountActive,
    employeeCountActive: snapshot.employeeCountActive,
    publicBookingEnabled: snapshot.publicBookingEnabled,
    linkedEmployeeServiceCount: snapshot.linkedEmployeeServiceCount,
    retrievalPath: 'empty-state-catalog',
  });
}

function resolveDeniedIntentForRole(
  surface: GuideFlowSurface,
  role: AccessTier | undefined,
  subject: string,
): string | undefined {
  if (!role) return undefined;
  const denied =
    surface === 'provider'
      ? PROVIDER_DENIED_BY_TIER[role]
      : DASHBOARD_DENIED_BY_TIER[role];
  if (denied.size === 0) return undefined;

  const normalized = subject.toLowerCase();
  for (const action of denied) {
    const actionWords = action.replace(/_/g, ' ');
    if (normalized.includes(actionWords) || actionWords.includes(normalized)) {
      return action;
    }
  }
  return undefined;
}

export async function handleExplainVisibilityBlockLogic(
  deps: EmptyStateGuideLogicDeps,
  ctx: EmptyStateGuideContext,
): Promise<CommandResult> {
  const locale = resolveLocale(ctx.locale);
  const snapshot = await loadEmptyStateGuideSnapshot(deps, ctx);
  if (!snapshot) {
    return failure('explain_visibility_block', 'Business not found.');
  }

  const prompt = ctx.prompt ?? '';
  const subject = extractVisibilitySubject(prompt, ctx.params ?? {});
  const reasons: string[] = [];
  const steps: GuideResponse['steps'] = [];
  let navigate = buildNavigate('/dashboard/billing');

  const guideInput: ProductGuideLogicInput = {
    businessId: ctx.businessId,
    prompt,
    params: ctx.params ?? {},
    route: ctx.route,
    locale: ctx.locale,
    role: ctx.role,
    enabledModules: ctx.enabledModules,
    surface: ctx.surface,
    session: ctx.session,
  };
  const listCtx = buildGuideFlowListContextFromInput(guideInput);
  const messages = getFrontendGuideCorpusMessages(locale);
  const activeVerticals = resolveActiveGuideVerticalOverlays(listCtx);

  const topicCandidates = [
    readString(ctx.params?.topicId),
    resolveGuideFlowRoutePrimaryTopic(ctx.route),
  ].filter((row): row is string => Boolean(row));

  for (const topicId of topicCandidates) {
    const playbook = findGuideFlowPlaybookByTopicId(topicId);
    if (!playbook) continue;
    if (
      !isGuideFlowPlaybookRoleVerticalVisible(
        playbook,
        listCtx,
        activeVerticals,
      )
    ) {
      reasons.push(
        locale === 'hy'
          ? `${subject} թաքնված է ձեր role/vertical filter-ով։`
          : locale === 'ru'
            ? `${subject} скрыт фильтром роли/вертикали.`
            : `${subject} is hidden by your role or vertical filter.`,
      );
      steps.push({
        title:
          locale === 'hy'
            ? 'Role / vertical filter'
            : locale === 'ru'
              ? 'Фильтр роли / вертикали'
              : 'Role / vertical filter',
        body:
          locale === 'hy'
            ? 'Ստուգեք session roleProfile/vertical կամ խնդրեք manager-ին բացել այս playbook-ը։'
            : locale === 'ru'
              ? 'Проверьте roleProfile/vertical в сессии или попросите менеджера открыть этот playbook.'
              : 'Check session roleProfile/vertical or ask a manager to unlock this playbook.',
      });
      break;
    }
    if (!isGuideFlowPlaybookEntitlementAllowed(playbook, listCtx)) {
      const gate = describeGuidePlaybookGate(
        playbook,
        listCtx,
        locale,
        messages,
      );
      reasons.push(gate.summary);
      steps.push({
        title: gate.featureLabel,
        body: gate.summary,
        navigate: buildNavigate('/dashboard/billing'),
      });
      navigate = buildNavigate('/dashboard/billing');
      break;
    }
  }

  const deniedIntent = resolveDeniedIntentForRole(
    ctx.surface,
    ctx.role,
    subject,
  );
  if (deniedIntent) {
    reasons.push(
      locale === 'hy'
        ? `Ձեր ${snapshot.role ?? 'staff'} role-ը չի թույլատրում «${deniedIntent}» գործողությունը — ${subject} կարող է թաքնված լինել։`
        : locale === 'ru'
          ? `Ваша роль ${snapshot.role ?? 'staff'} не разрешает «${deniedIntent}» — ${subject} может быть скрыт.`
          : `Your ${snapshot.role ?? 'staff'} role cannot run "${deniedIntent}" — ${subject} may be hidden.`,
    );
    steps.push({
      title:
        locale === 'hy'
          ? 'Role permission'
          : locale === 'ru'
            ? 'Права роли'
            : 'Role permission',
      body:
        locale === 'hy'
          ? 'Manager/owner role-ով մուտք գործեք կամ խնդրեք owner-ին բացել այս screen-ը։'
          : locale === 'ru'
            ? 'Войдите под manager/owner или попросите владельца открыть этот экран.'
            : 'Sign in as manager/owner or ask the owner to grant access to this screen.',
    });
  }

  if (
    ctx.surface === 'provider' &&
    snapshot.role === 'staff' &&
    /\b(?:team|everyone|all\s+providers?|schedule\s+tab)\b/i.test(prompt)
  ) {
    reasons.push(
      locale === 'hy'
        ? 'Staff tier provider app-ում team-wide schedule tabs-ը թաքնված են — միայն ձեր calendar-ը։'
        : locale === 'ru'
          ? 'На tier staff в provider app скрыты team schedule tabs — только ваш календарь.'
          : 'On staff tier the provider app hides team-wide schedule tabs — you only see your calendar.',
    );
    steps.push({
      title:
        locale === 'hy'
          ? 'Staff calendar scope'
          : locale === 'ru'
            ? 'Область календаря staff'
            : 'Staff calendar scope',
      body:
        locale === 'hy'
          ? 'Manager role-ով մուտք գործեք team view-ի համար, կամ օգտագործեք Today/Calendar tabs-ը ձեր appointments-ի համար։'
          : locale === 'ru'
            ? 'Войдите как manager для team view или используйте Today/Calendar для своих записей.'
            : 'Sign in as manager for team view, or use Today/Calendar for your own appointments.',
      navigate: buildNavigate('/tabs/today'),
    });
    navigate = buildNavigate('/tabs/today');
  }

  if (reasons.length === 0) {
    const fallback =
      locale === 'hy'
        ? `${subject} — live settings-ով ակնհայտ block չգտվեց։ Ստուգեք plan tier (${snapshot.planTierId}), enabled modules, և role (${snapshot.role ?? 'unknown'}).`
        : locale === 'ru'
          ? `${subject} — по live-настройкам явной блокировки нет. Проверьте plan tier (${snapshot.planTierId}), modules и role (${snapshot.role ?? 'unknown'}).`
          : `${subject} — no obvious live block found. Check plan tier (${snapshot.planTierId}), enabled modules, and role (${snapshot.role ?? 'unknown'}).`;
    reasons.push(fallback);
    steps.push({
      title:
        locale === 'hy'
          ? 'Live settings check'
          : locale === 'ru'
            ? 'Проверка live-настроек'
            : 'Live settings check',
      body: fallback,
      navigate: buildNavigate('/dashboard/settings'),
    });
    navigate = buildNavigate('/dashboard/settings');
  }

  const summary = reasons.join(' ');
  const guide = buildEmptyStateGuideResponse({
    topicId: 'live.visibility-block',
    summary,
    steps,
    navigate,
  });

  return success('explain_visibility_block', summary, guide, {
    subject,
    role: snapshot.role,
    planTierId: snapshot.planTierId,
    enabledModules: snapshot.enabledModules,
    retrievalPath: 'empty-state-visibility',
  });
}

export async function runEmptyStateGuideIntentLogic(
  deps: EmptyStateGuideLogicDeps,
  intent: EmptyStateGuideIntent,
  ctx: EmptyStateGuideContext,
): Promise<CommandResult> {
  switch (intent) {
    case 'explain_visibility_block':
      return handleExplainVisibilityBlockLogic(deps, ctx);
    case 'explain_empty_catalog':
      return handleExplainEmptyCatalogLogic(deps, ctx);
    case 'explain_stripe_not_connected':
      return handleExplainStripeNotConnectedLogic(deps, ctx);
    default:
      return failure(
        intent,
        `Unsupported empty-state guide intent: ${intent}.`,
      );
  }
}
