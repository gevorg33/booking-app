import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ClinicTestOrderIntent } from './ai-clinic-test-order.util.js';

export interface ClinicTestOrderEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: ClinicTestOrderIntent;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Armenian/Russian dashboard clinic lab test orders (i18n-clinic-v2-ai-1). */
export const CLINIC_TEST_ORDER_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic lab test orders (dashboard only):
  - create_test_order: hy «պատվիրի՛ր CBC», «ավելացրի՛ր լաբորատոր թեստ», «ստեղծի՛ր BMP և CBC» + հիվանդ/այց + optional վաղը; ru «закажи CBC», «оформи заказ на анализы», «добавь лабораторный тест» + для пациента/визита + optional завтра. Requires customerName or bookingId and testNames. NOT create_booking (schedule appointment).
  - list_test_orders: hy «ցույց տուր լաբորատոր պատվերները», «ինչ թեստի պատվերներ», «սպասող լաբորատոր պատվերներ»; ru «покажи лабораторные заказы», «список ожидающих заказов», «какие тестовые заказы». READ queue — NOT list_bookings and NOT create_test_order.
  - Keep Latin catalog codes (CBC, BMP, lipid panel) inside hy/ru sentences as testNames.`;

export const MULTILINGUAL_CLINIC_TEST_ORDER_EVAL_SCENARIOS: ClinicTestOrderEvalScenario[] =
  [
    {
      id: 'hy-cbc-lipid-maria-tomorrow',
      locale: 'hy',
      prompt: 'Պատվիրի՛ր CBC և lipid panel Մարիայի վաղը այցի համար',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: {
        customerName: 'Մարիա',
        testNames: ['CBC', 'lipid panel'],
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-cbc-john',
      locale: 'hy',
      prompt: 'Ավելացրի՛ր CBC պատվեր Ջոնի համար',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Ջոն', testNames: ['CBC'] },
      needsMultilingual: true,
    },
    {
      id: 'hy-bmp-cbc-anna',
      locale: 'hy',
      prompt: 'Ստեղծի՛ր BMP և CBC թեստ Աննայի վաղը այցի համար',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Աննա', testNames: ['BMP', 'CBC'] },
      needsMultilingual: true,
    },
    {
      id: 'hy-lipid-maria',
      locale: 'hy',
      prompt: 'Պատվիրի՛ր lipid panel Մարիայի համար վաղը',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Մարիա', testNames: ['lipid panel'] },
      needsMultilingual: true,
    },
    {
      id: 'hy-cbc-bmp-james',
      locale: 'hy',
      prompt: 'Ավելացրի՛ր CBC, BMP Ջեյմսի այցի համար',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Ջեյմս', testNames: ['CBC', 'BMP'] },
      needsMultilingual: true,
    },
    {
      id: 'hy-blood-work-alex',
      locale: 'hy',
      prompt: 'Պատվիրի՛ր արյան աշխատանք CBC Ալեքսի համար վաղը',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Ալեքս', testNames: ['CBC'] },
      needsMultilingual: true,
    },
    {
      id: 'hy-show-maria-orders',
      locale: 'hy',
      prompt: 'Ցույց տուր Մարիայի լաբորատոր պատվերները վաղը',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-pending-queue',
      locale: 'hy',
      prompt: 'Ցուցակավորի՛ր սպասող լաբորատոր պատվերները',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { status: 'NotCollected' },
      needsMultilingual: true,
    },
    {
      id: 'hy-what-orders-maria',
      locale: 'hy',
      prompt: 'Ինչ թեստի պատվերներ ունի Մարիան վաղը',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-awaiting-collection',
      locale: 'hy',
      prompt: 'Ցույց տուր հավաքման սպասող լաբորատոր պատվերները',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { status: 'NotCollected' },
      needsMultilingual: true,
    },
    {
      id: 'hy-john-friday-orders',
      locale: 'hy',
      prompt: 'Ցուցադրի՛ր Ջոնի թեստի պատվերները ուրբաթ',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { customerName: 'Ջոն' },
      needsMultilingual: true,
    },
    {
      id: 'hy-open-lab-orders',
      locale: 'hy',
      prompt: 'Ցույց տուր բաց լաբորատոր պատվերները',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      needsMultilingual: true,
    },
    {
      id: 'ru-cbc-lipid-maria-tomorrow',
      locale: 'ru',
      prompt: 'Закажи CBC и lipid panel для визита Марии завтра',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: {
        customerName: 'Мария',
        testNames: ['CBC', 'lipid panel'],
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-cbc-john',
      locale: 'ru',
      prompt: 'Оформи заказ CBC для Джона в пятницу',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Джон', testNames: ['CBC'] },
      needsMultilingual: true,
    },
    {
      id: 'ru-bmp-cbc-anna',
      locale: 'ru',
      prompt: 'Добавь BMP и CBC для пациента Анны завтра',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Анна', testNames: ['BMP', 'CBC'] },
      needsMultilingual: true,
    },
    {
      id: 'ru-lipid-maria',
      locale: 'ru',
      prompt: 'Закажи lipid panel для Марии завтра',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Мария', testNames: ['lipid panel'] },
      needsMultilingual: true,
    },
    {
      id: 'ru-lab-order-james',
      locale: 'ru',
      prompt: 'Создай лабораторный заказ CBC, BMP для Джеймса',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Джеймс', testNames: ['CBC', 'BMP'] },
      needsMultilingual: true,
    },
    {
      id: 'ru-cbc-alex',
      locale: 'ru',
      prompt: 'Оформи CBC для пациента Алекса завтра',
      expectedAction: 'create_test_order',
      rescueReason: 'create_test_order',
      paramsPartial: { customerName: 'Алекс', testNames: ['CBC'] },
      needsMultilingual: true,
    },
    {
      id: 'ru-show-maria-orders',
      locale: 'ru',
      prompt: 'Покажи лабораторные заказы Марии на завтра',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-pending-week',
      locale: 'ru',
      prompt: 'Список ожидающих лабораторных заказов на этой неделе',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { status: 'NotCollected' },
      needsMultilingual: true,
    },
    {
      id: 'ru-what-orders-maria',
      locale: 'ru',
      prompt: 'Какие тестовые заказы у Марии на завтра',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-awaiting-collection',
      locale: 'ru',
      prompt: 'Покажи заказы на анализы, ожидающие забора',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { status: 'NotCollected' },
      needsMultilingual: true,
    },
    {
      id: 'ru-john-friday-orders',
      locale: 'ru',
      prompt: 'Покажи тестовые заказы Джона в пятницу',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      paramsPartial: { customerName: 'Джон' },
      needsMultilingual: true,
    },
    {
      id: 'ru-open-lab-orders',
      locale: 'ru',
      prompt: 'Список открытых лабораторных заказов',
      expectedAction: 'list_test_orders',
      rescueReason: 'list_test_orders',
      needsMultilingual: true,
    },
  ];
