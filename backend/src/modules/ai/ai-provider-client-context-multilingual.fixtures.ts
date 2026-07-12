import { PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS } from './ai-provider-client-context.fixtures.js';
import type { ProviderClientContextIntent } from './ai-provider-client-context.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderClientContextMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderClientContextIntent;
  rescueReason: ProviderClientContextIntent;
  paramsPartial?: Record<string, unknown>;
};

/** EN rows that already ship HY/RU siblings in the main fixture table. */
export const PROVIDER_CLIENT_CONTEXT_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {
  'summarize-this-client-en': {
    hy: 'summarize-client-hy',
    ru: 'summarize-client-ru',
  },
  'history-this-client-en': {
    hy: 'history-hy',
    ru: 'history-ru',
  },
  'note-add-en': {
    hy: 'note-hy',
    ru: 'note-ru',
  },
};

const SUMMARIZE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'summarize-client-name-en': {
    hy: 'Ինչ պետք է իմանամ Jane Doe-ի մասին այս ամրագրումից առաջ',
    ru: 'Что мне нужно знать о Jane Doe перед этой записью?',
    paramsPartial: { customerName: 'Jane Doe' },
  },
  'summarize-client-overview-en': {
    hy: 'Տվիր John-ի հաճախորդի ամփոփագիրը',
    ru: 'Дай обзор клиента John',
  },
  'summarize-client-preferences-en': {
    hy: 'Պատմիր իմ հաջորդ հաճախորդի մասին — լոյալտի կամ referral տվյալներ կա՞',
    ru: 'Расскажи о моём следующем клиенте — есть ли лояльность или реферал?',
  },
  'summarize-client-visit-count-en': {
    hy: 'Քանի անգամ է Sarah-ն եկել և երբ էր վերջին այցը',
    ru: 'Сколько раз Sarah была здесь и когда был последний визит?',
  },
  'summarize-client-no-shows-en': {
    hy: 'Mike-ի հաճախորդի snapshot — այցեր և no-show-ներ',
    ru: 'Снимок клиента Mike — визиты и no-show',
  },
  'summarize-client-before-color-en': {
    hy: 'Կարճ ամփոփիր Emma-ին նրա color service-ից առաջ',
    ru: 'Кратко расскажи об Emma перед её color service',
  },
  'summarize-client-marketing-en': {
    hy: 'Այս հաճախորդը marketing email-ներին համաձայնու՞մ է',
    ru: 'Этот клиент согласен на marketing email?',
  },
  'summarize-client-referral-en': {
    hy: 'Այս հաճախորդին referral-ով եկե՞լ է մեկը',
    ru: 'Этого клиента кто-то привёл по referral?',
  },
  'summarize-client-compound-en': {
    hy: 'Ամփոփիր Jane-ին; ցույց տուր նրա loyalty balance-ը',
    ru: 'Кратко расскажи о Jane; покажи её loyalty balance',
  },
};

const HISTORY_I18N: Record<string, { hy: string; ru: string }> = {
  'history-past-visits-en': {
    hy: 'Jane-ի նախկին ամրագրումներն այստեղ',
    ru: 'Прошлые записи Jane здесь',
  },
  'history-last-visit-en': {
    hy: 'Ե՞րբ էր John-ի վերջին այցը և ինչ service էր',
    ru: 'Когда John был в последний раз и какая была услуга?',
  },
  'history-recent-visits-en': {
    hy: 'Ցուցակ Sarah-ի վերջին completed visits-ը',
    ru: 'Список последних completed visits для Sarah',
  },
  'history-previous-services-en': {
    hy: 'Ինչ service-ներ է Mike-ն ստացել նախկին այցերում',
    ru: 'Какие service Mike получал на прошлых визитах?',
  },
  'history-client-record-en': {
    hy: 'Ցույց տուր Emma-ի visit record-ը',
    ru: 'Покажи visit record для Emma',
  },
  'history-prior-bookings-en': {
    hy: 'Նախորդ bookings-ը այս customer-ի համար',
    ru: 'Prior bookings для этого customer',
  },
  'history-completed-en': {
    hy: 'Իմ client-ի վերջին completed visits-ը այսօր',
    ru: 'Recent completed visits моего client сегодня',
  },
  'history-who-saw-en': {
    hy: 'Ո՞վ էր Jane-ին տեսել վերջին անգամ',
    ru: 'Кто видел Jane в последний раз?',
  },
};

const NOTE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'note-remember-en': {
    hy: 'Հիշիր, որ Jane-ը նախընտրում է quiet chair',
    ru: 'Запомни, что Jane предпочитает quiet chair',
  },
  'note-client-en': {
    hy: 'Ավելացրու note այս client-ի համար — extra toner է ուզում',
    ru: 'Добавь note для этого client — хочет extra toner',
  },
  'note-internal-en': {
    hy: 'Staff note: VIP — միշտ առաջարկել tea',
    ru: 'Staff note: VIP — всегда предлагать tea',
  },
  'note-quick-en': {
    hy: 'Note John-ի համար: sensitive scalp',
    ru: 'Note для John: sensitive scalp',
  },
  'note-save-en': {
    hy: 'Save client note — սովորաբար 10 րոպե ուշ է գալիս',
    ru: 'Save client note — обычно опаздывает на 10 минут',
  },
  'note-write-en': {
    hy: 'Գրիր նշոն Sarah-ի մասին՝ patch test on file',
    ru: 'Напиши заметку о Sarah: patch test on file',
  },
  'note-log-en': {
    hy: 'Log staff note Mike-ի համար: prefers Anna',
    ru: 'Log staff note для Mike: prefers Anna',
  },
  'note-this-booking-en': {
    hy: 'Ավելացրու նշum այս ամրագրության հաճախորդին՝ bring own product',
    ru: 'Добавь заметку клиенту этой записи: bring own product',
  },
};

const STAFF_NOTES_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'staff-notes-show-en': {
    hy: 'Ցույց տուր այս հաճախորդի staff notes-ը',
    ru: 'Покажи staff notes этого клиента',
  },
  'staff-notes-any-en': {
    hy: 'Կա՞ն նշումներ Jane-ի մասին',
    ru: 'Есть какие-нибудь заметки о Jane?',
  },
  'staff-notes-list-en': {
    hy: 'Ցուցակագրիր John-ի հաճախորդի նշումները',
    ru: 'Покажи список заметок клиента John',
  },
};

const CLIENT_INTAKE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'intake-what-say-en': {
    hy: 'Ի՞նչ է ասում նրանց pre-visit intake-ը',
    ru: 'Что говорит их pre-visit intake?',
  },
  'intake-show-answers-en': {
    hy: 'Ցույց տուր Jane-ի pre-visit intake պատասխանները',
    ru: 'Покажи ответы Jane на pre-visit intake',
  },
  'intake-fill-out-en': {
    hy: 'Նրանք լրացրե՞լ են intake հարցաշարը',
    ru: 'Они заполнили анкету intake?',
  },
  'intake-explain-en': {
    hy: 'Ցույց տուր նրա intake հարցաշարի պատասխանները',
    ru: 'Покажи её ответы на анкету intake',
  },
  'intake-summarize-form-en': {
    hy: 'Ցույց տուր նրա intake ձևը',
    ru: 'Покажи его форму intake',
  },
  'intake-allergies-en': {
    hy: 'Ի՞նչ ալերգիաներ ունի intake-ում',
    ru: 'Что говорят аллергии в анкете intake?',
  },
  'intake-questionnaire-answers-en': {
    hy: 'Ցույց տուր հարցաշարի պատասխանները',
    ru: 'Покажи ответы на опросник',
  },
  'intake-did-she-fill-en': {
    hy: 'Ցույց տուր՝ արդյոք նա լրացրել է intake հարցաշարը',
    ru: 'Покажи, заполнила ли она анкету intake',
  },
  'intake-form-say-en': {
    hy: 'Ի՞նչ է ասում intake հարցաշարը ալերգիաների մասին',
    ru: 'Что говорит анкета intake об аллергиях?',
  },
  'intake-answers-name-en': {
    hy: 'Ցույց տուր Maria-ի intake պատասխանները',
    ru: 'Покажи ответы Maria на intake',
  },
};

const PACKAGE_VISIT_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'package-visit-which-en': {
    hy: 'Ո՞ր փաթեթի այցն է սա',
    ru: 'Какой это визит по пакету?',
  },
  'package-visit-count-en': {
    hy: 'Սա փաթեթի 2-րդ այցն է 6-ից, այնպես չէ՞',
    ru: 'Это визит 2 из 6 по пакету, верно?',
  },
  'package-visit-how-many-left-en': {
    hy: 'Քանի՞ փաթեթի այց է մնացել նրան',
    ru: 'Сколько визитов по пакету у неё осталось?',
  },
  'package-visit-is-this-en': {
    hy: 'Սա փաթեթի այց է՞',
    ru: 'Это визит по пакету?',
  },
  'package-visit-what-package-en': {
    hy: 'Ո՞ր փաթեթի մասն է այս այցը',
    ru: 'Частью какого пакета является этот визит?',
  },
  'package-visit-remain-en': {
    hy: 'Քանի՞ այց է մնացել փաթեթում',
    ru: 'Сколько визитов осталось в пакете?',
  },
  'package-visit-which-for-john-en': {
    hy: 'Ո՞ր փաթեթի այցն է սա John-ի համար',
    ru: 'Какой это визит по пакету для John?',
  },
  'package-visit-number-en': {
    hy: 'Սա նրա փաթեթի 3-րդ այցն է՞',
    ru: 'Это её визит номер 3 по пакету?',
  },
  'package-visit-remaining-client-en': {
    hy: 'Քանի՞ փաթեթի այց է մնացել այս հաճախորդի համար',
    ru: 'Сколько визитов по пакету осталось у этого клиента?',
  },
  'package-visit-what-number-en': {
    hy: 'Ո՞ր համարի այցն է սա փաթեթում',
    ru: 'Какой это по счёту визит в пакете?',
  },
  'package-visit-progress-en': {
    hy: 'Ցուցադրիր Jane-ի փաթեթի այցերի ընթացքը',
    ru: 'Покажи прогресс визитов по пакету Jane',
  },
  'package-visit-left-on-plan-en': {
    hy: 'Քանի՞ այց է մնացել նրա փաթեթում',
    ru: 'Сколько визитов осталось в её пакете?',
  },
};

const MULTI_SERVICE_TIMELINE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'multi-service-timeline-blowdry-en': {
    hy: 'Ի՞նչ է հաջորդը այս blowdry-ից հետո',
    ru: 'Что дальше после фена?',
  },
  'multi-service-timeline-spa-order-en': {
    hy: 'Ի՞նչ է հաջորդը spa day-ում',
    ru: 'Что дальше в spa day?',
  },
  'multi-service-timeline-else-en': {
    hy: 'Ի՞նչ է հաջորդը այս ամրագրման մեջ',
    ru: 'Что дальше есть в этой записи?',
  },
  'multi-service-timeline-order-services-en': {
    hy: 'Ի՞նչ է հաջորդը ծառայությունների կարգում',
    ru: 'Что дальше по порядку услуг сегодня?',
  },
  'multi-service-timeline-next-service-en': {
    hy: 'Ի՞նչ է հաջորդը այս ծառայությունից հետո',
    ru: 'Что дальше после этой услуги?',
  },
  'multi-service-timeline-show-order-en': {
    hy: 'Ի՞նչ է հաջորդը այս multi-service-ում',
    ru: 'Что дальше в этой мульти-услуге?',
  },
  'multi-service-timeline-spa-day-order-en': {
    hy: 'Ի՞նչ է հաջորդը նրա spa day-ում',
    ru: 'Что дальше в её spa day?',
  },
  'multi-service-timeline-else-for-her-en': {
    hy: 'Ի՞նչ է հաջորդը այս ամրագրման մեջ նրա համար',
    ru: 'Что дальше у неё по этой записи?',
  },
  'multi-service-timeline-show-timeline-en': {
    hy: 'Ի՞նչ է հաջորդը multi-service ժամանակացույցում',
    ru: 'Что дальше по расписанию мульти-услуги?',
  },
  'multi-service-timeline-next-one-en': {
    hy: 'Ի՞նչ է հաջորդը սրանից հետո',
    ru: 'Что дальше после этого?',
  },
  'multi-service-timeline-which-first-en': {
    hy: 'Ի՞նչ է հաջորդը սրանից հետո',
    ru: 'Что дальше после этого?',
  },
  'multi-service-timeline-gap-between-en': {
    hy: 'Ի՞նչ է հաջորդը սրանից հետո',
    ru: 'Что дальше после этого?',
  },
};

const PAYMENT_BREAKDOWN_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'payment-breakdown-what-en': {
    hy: 'Ցույց տուր վճարման մանրամասն բաժանումը այս ամրագրման համար',
    ru: 'Покажи детальную разбивку оплаты по этой записи',
  },
  'payment-breakdown-show-en': {
    hy: 'Ի՞նչ բաժանում ունի այս ամրագրման վճարումը',
    ru: 'Разбей оплату по этой записи',
  },
  'payment-breakdown-prepaid-en': {
    hy: 'Նա նախավճարել է առցանց, ցույց տուր բաժանումը',
    ru: 'Она оплатила онлайн — покажи разбивку',
  },
  'payment-breakdown-total-en': {
    hy: 'Բաժանիր ընդհանուր գումարը այս ամրագրման վճարման մեջ',
    ru: 'Разбей общую сумму по этой записи с учётом оплаты',
  },
  'payment-breakdown-discounts-en': {
    hy: 'Մանրամասն ասա՝ ինչ զեղչեր են կիրառվել այս ամրագրման վճարման վրա',
    ru: 'Детализируй, какие скидки применены к оплате этой записи',
  },
  'payment-breakdown-included-en': {
    hy: 'Ի՞նչ է ներառված այս ամրագրման վճարման բաժանման մեջ',
    ru: 'Что входит в разбивку суммы оплаты за эту запись',
  },
  'payment-breakdown-price-en': {
    hy: 'Ցույց տուր գնի բաժանումը այս ժամադրության համար',
    ru: 'Покажи разбивку цены за эту запись',
  },
  'payment-breakdown-not-fully-paid-en': {
    hy: 'Ինչու՞ չի վճարված ամբողջությամբ այս ամրագրումը, ի՞նչ է բաժանումը',
    ru: 'Почему по записи не полная оплата — покажи разбивку',
  },
  'payment-breakdown-owes-en': {
    hy: 'Մանրամասն ասա որքան է նա պարտք վճարման մեջ այս ամրագրման համար',
    ru: 'Разбей, сколько она должна за эту запись по оплате',
  },
  'payment-breakdown-deposit-en': {
    hy: 'Որքա՞ն նախավճար է մնացել այս ամրագրման վրա, ցույց տուր մանրամասն',
    ru: 'Сколько депозита осталось по оплате этой записи, покажи детализировано',
  },
};

const DEPOSIT_BALANCE_DUE_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'deposit-balance-due-checkout-en': {
    hy: 'Որքա՞ն գումար է մնացել վճարման դեպքում',
    ru: 'Сколько осталось оплатить при оформлении?',
  },
  'deposit-balance-due-owe-en': {
    hy: 'Որքա՞ն է նա դեռ պարտք այս ամրագրման վճարման մեջ',
    ru: 'Сколько она ещё должна к оплате по этой записи?',
  },
  'deposit-balance-due-rest-en': {
    hy: '50% նախավճար — որքա՞ն է մնացորդը',
    ru: 'Депозит 50% — какой остаток к оплате?',
  },
  'deposit-balance-due-balance-en': {
    hy: 'Ի՞նչ է վճարման մնացորդը այս ամրագրման վրա',
    ru: 'Какой баланс к оплате по этой записи?',
  },
  'deposit-balance-due-visit-en': {
    hy: 'Որքա՞ն է մնացել վճարման համար այցի ժամանակ',
    ru: 'Какой остаток нужно доплатить в день визита?',
  },
  'deposit-balance-due-appointment-en': {
    hy: 'Որքա՞ն են նրանք դեռ պարտք վճարման տեսանկյունից այս ժամադրության դիմաց',
    ru: 'Сколько они ещё должны заплатить по этой записи?',
  },
  'deposit-balance-due-left-to-pay-en': {
    hy: 'Ի՞նչ մնացորդ կա վճարման այս ժամադրության համար',
    ru: 'Что осталось доплатить по этой записи?',
  },
  'deposit-balance-due-is-there-en': {
    hy: 'Կա՞ վճարման մնացորդ այս ամրագրման վրա',
    ru: 'Есть ли остаток к оплате по этой записи?',
  },
  'deposit-balance-due-collect-en': {
    hy: 'Որքա՞ն նախավճարից է մնացել հավաքագրման համար',
    ru: 'Сколько из депозита осталось доплатить?',
  },
  'deposit-balance-due-before-checkout-en': {
    hy: 'Ի՞նչ է նա պարտք մինչև վճարումը',
    ru: 'Что она должна доплатить перед визитом?',
  },
};

const RETAIL_CART_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'retail-cart-tab-en': {
    hy: 'Ինչ ապրանք կա retail tab-ում',
    ru: 'Покажи товары в retail tab',
  },
  'retail-cart-total-with-products-en': {
    hy: 'Ցույց տուր ապրանքների ցուցակը այս ամրագրման վրա',
    ru: 'Покажи список товаров по этой записи',
  },
  'retail-cart-show-cart-en': {
    hy: 'Ցույց տուր retail cart-ը այս ամրագրման համար',
    ru: 'Покажи розничную корзину по этой записи',
  },
  'retail-cart-what-products-en': {
    hy: 'Ցույց տուր ի՞նչ ապրանքներ կան այս ամրագրման վրա',
    ru: 'Какие товары есть по этой записи?',
  },
  'retail-cart-list-items-en': {
    hy: 'Ցուցակագրիր ապրանքները այս ժամադրության վրա',
    ru: 'Список товаров по этой записи',
  },
  'retail-cart-whats-in-cart-en': {
    hy: 'Ինչ ապրանք կա retail cart-ում այս ամրագրման համար',
    ru: 'Что в розничной корзине по этой записи?',
  },
  'retail-cart-show-section-en': {
    hy: 'Ցույց տուր ապրանքների բաժինը այս հաճախորդի համար',
    ru: 'Покажи раздел товаров для этого клиента',
  },
  'retail-cart-how-much-en': {
    hy: 'Ցույց տուր որքա՞ն ապրանք կա այս ամրագրման վրա',
    ru: 'Сколько товаров по этой записи?',
  },
  'retail-cart-retail-total-en': {
    hy: 'Ցույց տուր ապրանքների ընդհանուր գումարը այս ժամադրության համար',
    ru: 'Общая сумма товаров по этой записи?',
  },
  'retail-cart-show-buying-en': {
    hy: 'Ցույց տուր ինչ ապրանք է նա գնում',
    ru: 'Покажи какие товары она покупает',
  },
};

const CANCEL_POLICY_CLIENT_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'cancel-policy-client-what-en': {
    hy: 'Ո՞րն է մեր չեղարկման քաղաքականությունը այս հաճախորդի համար',
    ru: 'Какая у нас политика отмены для этого клиента?',
  },
  'cancel-policy-client-explain-en': {
    hy: 'Բացատրիր այս ամրագրման չեղարկման քաղաքականությունը',
    ru: 'Объясни политику отмены для этой записи',
  },
  'cancel-policy-client-lose-deposit-en': {
    hy: 'Նա կկորցնի՞ իր deposit-ը եթե չեղարկի',
    ru: 'Она потеряет депозит, если отменит запись?',
  },
  'cancel-policy-client-notice-en': {
    hy: 'Ինչքա՞ն ծանուցում է պետք այս ամրագրումը չեղարկելու համար',
    ru: 'Сколько уведомления нужно, чтобы отменить эту запись?',
  },
  'cancel-policy-client-reschedule-rules-en': {
    hy: 'Ո՞րն է հետաձգման քաղաքականությունը այս ամրագրման համար',
    ru: 'Какая политика переноса для этой записи?',
  },
  'cancel-policy-client-forfeit-en': {
    hy: 'Նա կկորցնի՞ deposit-ը եթե ուշ չեղարկի',
    ru: 'Он потеряет депозит, если отменит поздно?',
  },
  'cancel-policy-client-window-en': {
    hy: 'Ո՞րն է չեղարկման ծանուցման պատուհանը այս ամրագրման վրա',
    ru: 'Какое окно уведомления об отмене у этой записи?',
  },
  'cancel-policy-client-refundable-en': {
    hy: 'Նրա deposit-ը վերադարձվո՞ղ է եթե չեղարկի այս ամրագրումը',
    ru: 'Её депозит возвращаемый, если она отменит эту запись?',
  },
  'cancel-policy-client-rules-jane-en': {
    hy: 'Ասա ինձ Jane-ի ամրագրման չեղարկման կանոնները',
    ru: 'Скажи мне правила отмены для записи Jane',
  },
  'cancel-policy-client-keep-deposit-en': {
    hy: 'Նա պահո՞ւմ է deposit-ը եթե հետաձգում է չեղարկելու փոխարեն',
    ru: 'Она сохраняет депозит, если переносит запись вместо отмены?',
  },
};

const GIFT_CARD_REDEMPTION_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'gift-card-redemption-paying-with-en': {
    hy: 'Նա վճարում է նվեր քարտով — ի՞նչ է մնացորդը',
    ru: 'Она платит подарочной картой — какой баланс?',
  },
  'gift-card-redemption-how-much-en': {
    hy: 'Ի՞նչ մնացորդ ունի նվեր քարտի վրա',
    ru: 'Какой баланс у неё на подарочной карте?',
  },
  'gift-card-redemption-whats-left-en': {
    hy: 'Ի՞նչ մնացորդ կա նվեր քարտի վրա',
    ru: 'Какой остаток на подарочной карте?',
  },
  'gift-card-redemption-jane-balance-en': {
    hy: 'Ի՞նչ է Jane-ի նվեր քարտի մնացորդը',
    ru: 'Какой баланс подарочной карты у Jane?',
  },
  'gift-card-redemption-remaining-on-her-card-en': {
    hy: 'Ինչքա՞ն մնացորդ կա նրա նվեր քարտի վրա',
    ru: 'Сколько остатка на её подарочной карте?',
  },
  'gift-card-redemption-check-balance-en': {
    hy: 'Ստուգիր նվեր քարտի մնացորդը այս ամրագրման համար',
    ru: 'Проверь баланс подарочной карты по этой записи',
  },
  'gift-card-redemption-how-much-left-en': {
    hy: 'Որքա՞ն նվեր քարտի մնացորդ է մնացել',
    ru: 'Сколько осталось баланса на подарочной карте?',
  },
  'gift-card-redemption-using-gift-card-en': {
    hy: 'Նա օգտագործում է նվեր քարտ — ի՞նչ է մնացորդը',
    ru: 'Она использует подарочную карту — какой баланс?',
  },
  'gift-card-redemption-johns-balance-en': {
    hy: 'Ի՞նչ է John-ի նվեր քարտի մնացորդը',
    ru: 'Какой баланс подарочной карты у John?',
  },
  'gift-card-redemption-on-his-card-en': {
    hy: 'Ինչքա՞ն մնացորդ կա նրա նվեր քարտի վրա',
    ru: 'Сколько остатка на его подарочной карте?',
  },
  'gift-card-redemption-covered-service-only-en': {
    hy: 'Նվեր քարտը ծածկեց միայն ծառայությունը — մնացորդ կա՞',
    ru: 'Подарочная карта покрыла только услугу — остался ли баланс?',
  },
};

const TOUR_GROUP_I18N: Record<
  string,
  { hy: string; ru: string; paramsPartial?: Record<string, unknown> }
> = {
  'tour-group-how-many-pax-en': {
    hy: 'Քանի՞ մասնակից կա այս տուրում',
    ru: 'Сколько человек в этом туре?',
  },
  'tour-group-booking-details-en': {
    hy: 'Քանի՞ մասնակից կա այս տուրի ամրագրման մեջ',
    ru: 'Сколько человек в этой групповой записи на тур?',
  },
  'tour-group-how-many-people-en': {
    hy: 'Քանի՞ մասնակից կա այս տուր խմբում',
    ru: 'Сколько человек в этой тур-группе?',
  },
  'tour-group-pax-count-en': {
    hy: 'Ինչքա՞ն է խմբի չափը այս տուրում',
    ru: 'Какой размер группы в этом туре?',
  },
};

function pushClientContextMultilingualRows(
  rows: ProviderClientContextMultilingualScenario[],
  enScenarioId: string,
  expectedAction: ProviderClientContextIntent,
  i18n: { hy: string; ru: string; paramsPartial?: Record<string, unknown> },
): void {
  for (const locale of ['hy', 'ru'] as const) {
    rows.push({
      id: `${enScenarioId}-${locale}`,
      enScenarioId,
      locale,
      prompt: locale === 'hy' ? i18n.hy : i18n.ru,
      expectedAction,
      rescueReason: expectedAction,
      ...(i18n.paramsPartial ? { paramsPartial: i18n.paramsPartial } : {}),
    });
  }
}

function buildProviderClientContextMultilingualScenarios(): ProviderClientContextMultilingualScenario[] {
  const rows: ProviderClientContextMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(SUMMARIZE_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'summarize_client',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(HISTORY_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'show_client_history',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(NOTE_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'add_client_note',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(STAFF_NOTES_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'list_client_staff_notes',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(CLIENT_INTAKE_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_client_intake',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(PACKAGE_VISIT_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_package_visit_context',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    MULTI_SERVICE_TIMELINE_I18N,
  )) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_multi_service_timeline',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    PAYMENT_BREAKDOWN_I18N,
  )) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_booking_payment_breakdown',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    DEPOSIT_BALANCE_DUE_I18N,
  )) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_deposit_balance_due',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(RETAIL_CART_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_retail_cart',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    CANCEL_POLICY_CLIENT_I18N,
  )) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_cancel_policy_for_client',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(
    GIFT_CARD_REDEMPTION_I18N,
  )) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_gift_card_redemption',
      i18n,
    );
  }
  for (const [enScenarioId, i18n] of Object.entries(TOUR_GROUP_I18N)) {
    pushClientContextMultilingualRows(
      rows,
      enScenarioId,
      'explain_tour_group_on_booking',
      i18n,
    );
  }

  return rows;
}

export const PROVIDER_CLIENT_CONTEXT_EN_SCENARIO_IDS: string[] =
  PROVIDER_CLIENT_CONTEXT_PROMPT_SCENARIOS.filter((row) =>
    row.id.endsWith('-en'),
  ).map((row) => row.id);

export const PROVIDER_CLIENT_CONTEXT_MULTILINGUAL_SCENARIOS: ProviderClientContextMultilingualScenario[] =
  buildProviderClientContextMultilingualScenarios();
