import type { AppLocale } from '../../common/utils/business-locale.util.js';

export const CATALOG_NOTIFY_CLASSIFIER_RULES = `- create_package / update_package with notifyCustomers=true when the user asks to notify/email/push/announce/message customers about a new or updated service package. Set notifyCustomers=true. Omit notificationTemplate unless the user pastes subject/body — the system fills defaults per enabled locale. NOT create_package_booking (staff appointment), NOT trigger_reengagement (CRM win-back), NOT configure_marketing_automation (automation rules).
- create_subscription_plan / update_subscription_plan with notifyCustomers=true when the user asks to notify customers about a membership/subscription plan. Use planName in templates. NOT assign_subscription_to_customer (enroll one customer), NOT discover_subscription_plans (public read).
- Compound: "Create Spa Day package … and notify customers" → create_package with notifyCustomers=true in one step. "Update nail membership plan and email clients" → update_subscription_plan + notifyCustomers=true.
- Skip notify when user says don't notify / without emailing / skip announcement — omit notifyCustomers or set false.
- Examples:
  - "Create Spa Day package with massage + facial 15% off and notify customers" → create_package, notifyCustomers=true
  - "Update Glow package discount to 20% and push an announcement to clients" → update_package, notifyCustomers=true
  - "Add 12-month nail plan 24 visits for Nail Care and email subscribers" → create_subscription_plan, notifyCustomers=true
  - "Update nail club membership and tell customers" → update_subscription_plan, notifyCustomers=true
  - "Create Bridal package with hair + makeup and do not notify customers" → create_package, notifyCustomers=false
  - "Ստեղծիր «Սպա օր» փաթեթը և տեղեկացրի՛ր հաճախորդներին" → create_package, notifyCustomers=true
  - "Обнови пакет Glow и уведоми клиентов" → update_package, notifyCustomers=true
  - "Добавь 12-месячный nail plan и оповести клиентов" → create_subscription_plan, notifyCustomers=true`;

export type CatalogNotifyDashboardScenario = {
  id: string;
  prompt: string;
  expectedAction:
    | 'create_package'
    | 'update_package'
    | 'create_subscription_plan'
    | 'update_subscription_plan';
  notifyCustomers: boolean;
  localeHint?: AppLocale;
};

export const CATALOG_NOTIFY_DASHBOARD_SCENARIOS: CatalogNotifyDashboardScenario[] =
  [
    {
      id: 'notify-create-package-en',
      prompt:
        'Create Spa Day package with massage + facial 15% off and notify customers',
      expectedAction: 'create_package',
      notifyCustomers: true,
      localeHint: 'en',
    },
    {
      id: 'notify-update-package-en',
      prompt:
        'Update Glow package discount to 20% and push an announcement to clients',
      expectedAction: 'update_package',
      notifyCustomers: true,
      localeHint: 'en',
    },
    {
      id: 'notify-create-plan-en',
      prompt:
        'Add 12-month nail plan 24 visits for Nail Care and email subscribers',
      expectedAction: 'create_subscription_plan',
      notifyCustomers: true,
      localeHint: 'en',
    },
    {
      id: 'notify-update-plan-en',
      prompt: 'Update nail club membership and tell customers about it',
      expectedAction: 'update_subscription_plan',
      notifyCustomers: true,
      localeHint: 'en',
    },
    {
      id: 'notify-update-plan-hy',
      prompt: 'Թարմացրի՛r nail club membership-ը և տեղեկացրի՛r հաճախորդներին',
      expectedAction: 'update_subscription_plan',
      notifyCustomers: true,
      localeHint: 'hy',
    },
    {
      id: 'notify-skip-package-en',
      prompt:
        'Create Bridal package with hair + makeup and do not notify customers',
      expectedAction: 'create_package',
      notifyCustomers: false,
      localeHint: 'en',
    },
    {
      id: 'notify-create-package-hy',
      prompt:
        'Ստեղծիր «Սպա օր» փաթեթը մերսում + դեմք և տեղեկացրի՛ր հաճախորդներին',
      expectedAction: 'create_package',
      notifyCustomers: true,
      localeHint: 'hy',
    },
    {
      id: 'notify-update-package-hy',
      prompt: 'Թարմացրի՛ր Glow փաթեթը և ուղարկի՛ր push հաճախորդներին',
      expectedAction: 'update_package',
      notifyCustomers: true,
      localeHint: 'hy',
    },
    {
      id: 'notify-create-plan-hy',
      prompt:
        'Ավելացրի՛ր 12 ամսյան nail plan 24 այց Nail Care-ի համար և տեղեկացրի՛ր բաժանորդներին',
      expectedAction: 'create_subscription_plan',
      notifyCustomers: true,
      localeHint: 'hy',
    },
    {
      id: 'notify-update-package-ru',
      prompt: 'Обнови пакет Glow и уведоми клиентов о скидке',
      expectedAction: 'update_package',
      notifyCustomers: true,
      localeHint: 'ru',
    },
    {
      id: 'notify-create-plan-ru',
      prompt:
        'Добавь 12-месячный nail plan на 24 визита для Nail Care и оповести клиентов',
      expectedAction: 'create_subscription_plan',
      notifyCustomers: true,
      localeHint: 'ru',
    },
    {
      id: 'notify-announce-package-ru',
      prompt:
        'Создай пакет Spa Day с массажем и лицом и разошли объявление клиентам',
      expectedAction: 'create_package',
      notifyCustomers: true,
      localeHint: 'ru',
    },
    {
      id: 'notify-compound-and-en',
      prompt:
        'Create Summer Glow package with facial 10% off and notify all customers by email',
      expectedAction: 'create_package',
      notifyCustomers: true,
      localeHint: 'en',
    },
  ];
