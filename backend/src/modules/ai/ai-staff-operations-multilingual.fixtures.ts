import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { StaffOperationsIntent } from './ai-staff-operations.util.js';
import {
  CONFIGURE_ONLINE_BOOKING_PROMPTS,
  CREATE_EMPLOYEE_PROMPTS,
  DEACTIVATE_EMPLOYEE_PROMPTS,
  INVITE_STAFF_MEMBER_PROMPTS,
  STAFF_OPERATIONS_EN_SCENARIO_IDS,
} from './ai-staff-operations.fixtures.js';

export type StaffOperationsMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: StaffOperationsIntent;
  rescueReason: StaffOperationsIntent;
  paramsPartial?: Record<string, unknown>;
};

const CREATE_I18N: Record<string, { hy: string; ru: string }> = {
  'staff-create-anna-en': {
    hy: 'Ավելացրու stylist Anna-ն թիմում',
    ru: 'Добавь stylist Anna в команду',
  },
  'staff-create-maria-services-en': {
    hy: 'Ստեղծիր աշխատակից Maria massage services-ով',
    ru: 'Создай сотрудника Maria с услугами massage',
  },
  'staff-create-email-en': {
    hy: 'Ընդունիր provider Jake jake@salon.com',
    ru: 'Нанимай provider Jake jake@salon.com',
  },
  'staff-create-onboard-en': {
    hy: 'Onboard արա therapist Sofia roster-ում',
    ru: 'Онбордни therapist Sofia в roster',
  },
  'staff-create-register-en': {
    hy: 'Գրանցիր team member David որպես provider',
    ru: 'Зарегистрируй team member David как provider',
  },
  'staff-create-color-en': {
    hy: 'Ավելացրու color specialist Emma staff-ում',
    ru: 'Добавь color specialist Emma в staff',
  },
  'staff-create-nails-en': {
    hy: 'Ստեղծիր employee Nina nails services-ով',
    ru: 'Создай employee Nina с nails services',
  },
  'staff-create-phone-en': {
    hy: 'Hire արա stylist Leo leo@spa.com',
    ru: 'Нанимай stylist Leo leo@spa.com',
  },
  'staff-create-barber-en': {
    hy: 'Ավելացրու barber Chris team roster-ում',
    ru: 'Добавь barber Chris в team roster',
  },
  'staff-create-reception-en': {
    hy: 'Ստեղծիր staff member Olivia front desk-ի համար',
    ru: 'Создай staff member Olivia для front desk',
  },
  'staff-create-multi-skill-en': {
    hy: 'Hire արա provider Maya haircut and color services-ով',
    ru: 'Нанимай provider Maya с haircut and color services',
  },
};

const INVITE_I18N: Record<string, { hy: string; ru: string }> = {
  'staff-invite-email-en': {
    hy: 'Հրավիր anna@salon.com provider app',
    ru: 'Пригласи anna@salon.com в provider app',
  },
  'staff-invite-name-en': {
    hy: 'Ուղարկիր staff invitation Maria-ին dashboard access-ի համար',
    ru: 'Отправь staff invitation Maria для dashboard access',
  },
  'staff-invite-team-en': {
    hy: 'Հրավիր staff member provider app',
    ru: 'Пригласи staff member в provider app',
  },
  'staff-invite-provider-en': {
    hy: 'Ուղարկիր invitation provider Jake-ին app access-ի համար',
    ru: 'Отправь invitation provider Jake для app access',
  },
  'staff-invite-dashboard-en': {
    hy: 'Հրավիր anna@salon.com dashboard և provider app',
    ru: 'Пригласи anna@salon.com в dashboard и provider app',
  },
  'staff-invite-stylist-en': {
    hy: 'Հրավիր stylist Emma mobile app',
    ru: 'Пригласи stylist Emma в mobile app',
  },
  'staff-invite-email-only-en': {
    hy: 'Ուղարկիր staff invite team@salon.com',
    ru: 'Отправь staff invite на team@salon.com',
  },
  'staff-invite-new-hire-en': {
    hy: 'Ուղարկիր invitation new employee David provider app-ի համար',
    ru: 'Отправь invitation new employee David для provider app',
  },
  'staff-invite-access-en': {
    hy: 'Հրավիր Maria staff app access',
    ru: 'Пригласи Maria на staff app access',
  },
  'staff-invite-roster-en': {
    hy: 'Հրավիր provider on roster leo@spa.com app',
    ru: 'Пригласи provider on roster leo@spa.com в app',
  },
  'staff-invite-manager-en': {
    hy: 'Ուղարկիր invitation manager Olivia dashboard access',
    ru: 'Отправь invitation manager Olivia для dashboard access',
  },
};

const DEACTIVATE_I18N: Record<string, { hy: string; ru: string }> = {
  'staff-deactivate-gevorg-en': {
    hy: 'Ապաակտիվացրու employee Gevorg',
    ru: 'Деактивируй employee Gevorg',
  },
  'staff-remove-maria-en': {
    hy: 'Հեռացրու Maria-ն թիմից',
    ru: 'Удали Maria из команды',
  },
  'staff-deactivate-provider-en': {
    hy: 'Ջնջիր provider Anna staff roster-ից',
    ru: 'Удали provider Anna из staff roster',
  },
  'staff-offboard-jake-en': {
    hy: 'Offboard արա stylist Jake active staff-ից',
    ru: 'Offboard stylist Jake из active staff',
  },
  'staff-archive-emma-en': {
    hy: 'Արխիվացրու employee Emma roster-ում',
    ru: 'Архивируй employee Emma в roster',
  },
  'staff-remove-david-en': {
    hy: 'Հեռացրու team member David staff-ից',
    ru: 'Убери team member David из staff',
  },
  'staff-deactivate-leo-en': {
    hy: 'Ապաակտիվացրու provider Leo',
    ru: 'Деактивируй provider Leo',
  },
  'staff-delete-chris-en': {
    hy: 'Ջնջիր staff member Chris թիմից',
    ru: 'Удали staff member Chris из команды',
  },
  'staff-remove-sofia-en': {
    hy: 'Հեռացրու Sofia team roster-ից',
    ru: 'Убери Sofia из team roster',
  },
  'staff-deactivate-nina-en': {
    hy: 'Ապաակտիվացրու stylist Nina',
    ru: 'Деактивируй stylist Nina',
  },
  'staff-offboard-olivia-en': {
    hy: 'Offboard արա employee Olivia providers-ից',
    ru: 'Offboard employee Olivia из providers',
  },
};

const CONFIGURE_I18N: Record<string, { hy: string; ru: string }> = {
  'staff-enable-booking-en': {
    hy: 'Միացրու online booking մեր public page-ում',
    ru: 'Включи online booking на нашей public page',
  },
  'staff-disable-booking-en': {
    hy: 'Անջատիր public booking website',
    ru: 'Отключи public booking website',
  },
  'staff-configure-booking-en': {
    hy: 'Կարգավորիր online booking settings',
    ru: 'Настрой online booking settings',
  },
  'staff-activate-booking-en': {
    hy: 'Ակտիվացրու book online booking link-ում',
    ru: 'Активируй book online на booking link',
  },
  'staff-hide-booking-en': {
    hy: 'Անջատիր online booking customers-ի համար',
    ru: 'Отключи online booking для customers',
  },
  'staff-setup-booking-en': {
    hy: 'Set up արա public booking page online',
    ru: 'Настрой public booking page online',
  },
  'staff-turn-on-booking-en': {
    hy: 'Միացրու online booking website հիմա',
    ru: 'Включи online booking website сейчас',
  },
  'staff-stop-booking-en': {
    hy: 'Կանգնեցրու public booking page bookings',
    ru: 'Останови public booking page bookings',
  },
  'staff-allow-booking-en': {
    hy: 'Թույլ տուր customers book online մեր site-ում',
    ru: 'Разреши customers book online на нашем site',
  },
  'staff-configure-public-en': {
    hy: 'Կարգավորիր մեր booking website settings',
    ru: 'Настрой наш booking website settings',
  },
  'staff-hide-public-en': {
    hy: 'Թաքցրու public booking link customers-ից',
    ru: 'Скрой public booking link от customers',
  },
};

const ALL_I18N: Record<string, { hy: string; ru: string }> = {
  ...CREATE_I18N,
  ...INVITE_I18N,
  ...DEACTIVATE_I18N,
  ...CONFIGURE_I18N,
};

const EN_BY_ID = new Map(
  [
    ...CREATE_EMPLOYEE_PROMPTS,
    ...INVITE_STAFF_MEMBER_PROMPTS,
    ...DEACTIVATE_EMPLOYEE_PROMPTS,
    ...CONFIGURE_ONLINE_BOOKING_PROMPTS,
  ].map((row) => [row.id, row]),
);

function buildStaffOperationsMultilingualScenarios(): StaffOperationsMultilingualScenario[] {
  const rows: StaffOperationsMultilingualScenario[] = [];
  for (const enScenarioId of STAFF_OPERATIONS_EN_SCENARIO_IDS) {
    const i18n = ALL_I18N[enScenarioId];
    const enRow = EN_BY_ID.get(enScenarioId);
    if (!i18n || !enRow) continue;
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: enRow.expectedAction,
        rescueReason: enRow.expectedAction,
        ...('expectedParams' in enRow && enRow.expectedParams
          ? { paramsPartial: enRow.expectedParams }
          : {}),
      });
    }
  }
  return rows;
}

export const STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS =
  buildStaffOperationsMultilingualScenarios();
