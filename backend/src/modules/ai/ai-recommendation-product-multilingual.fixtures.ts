import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type RecommendationProductEvalAction =
  | 'configure_recommendation_product'
  | 'link_recommended_products'
  | 'explain_recommendation_setup';

export interface RecommendationProductEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: RecommendationProductEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian post-checkout recommendation phrasing (ai-cmd-rec-4). */
export const RECOMMENDATION_PRODUCT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian post-checkout recommendation products (dashboard):
  - configure_recommendation_product: hy «ավելացրու շամպուն ապրանք checkout-ից հետո նկարի և հղման հետ», «ստեղծիր post-checkout ապրանք Repair Mask», «կարգավորիր checkout recommendation ապրանք Hair Serum»; ru «добавить шампунь товар для post-checkout с картинкой и ссылкой», «создать товар для рекомендаций после оплаты», «настроить checkout recommendation продукт». MUTATE product rows with imageUrl/externalLink — NOT link_recommended_products (attach links) and NOT create_product (retail SKU).
  - link_recommended_products: hy «առաջարկիր շամպուն և կոնդիցիոներ haircut ծառայությունից հետո», «կապել recommended products-ը Haircut service-ին», «կարգավորիր checkout recommendations Color-ի համար Repair Mask»; ru «рекомендовать шампунь и кондиционер после стрижки», «привязать рекомендуемые товары к услуге стрижка», «настроить checkout recommendations для Color». MUTATE service/category link lists — NOT configure_recommendation_product and NOT suggest_retail_upsell.
  - explain_recommendation_setup: hy «բացատրիր recommendation setup-ը», «որ ապրանքներ են կապված post-checkout recommendations-ին», «բացատրիր recommendation setup-ը Haircut ծառայության համար»; ru «объясни настройку рекомендаций», «какие товары привязаны к рекомендациям после оплаты», «опиши recommendation setup для услуги стрижка». READ max count + linked products per service/category — NOT link_recommended_products and NOT explain_checkout_recommendations (customer success screen).`;

export const MULTILINGUAL_RECOMMENDATION_PRODUCT_EVAL_SCENARIOS: RecommendationProductEvalScenario[] =
  [
    {
      id: 'hy-configure-shampoo-image-link',
      locale: 'hy',
      prompt:
        'Ավելացրու շամպուն ապրանք checkout-ից հետո նկարի և հղման հետ',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'շամպուն', wantsImage: true, wantsLink: true },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-repair-mask',
      locale: 'hy',
      prompt: 'Ստեղծիր post-checkout ապրանք Repair Mask',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'Repair Mask' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-hair-serum',
      locale: 'hy',
      prompt: 'Կարգավորիր checkout recommendation ապրանք Hair Serum',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'Hair Serum' },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-update-shampoo-image',
      locale: 'hy',
      prompt: 'Թարմացրու recommendation ապրանք Shampoo նկարը /uploads/shampoo.jpg',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'Shampoo', imageUrl: '/uploads/shampoo.jpg', isUpdate: true },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-shampoo-image-link',
      locale: 'ru',
      prompt:
        'Добавить шампунь товар для post-checkout с картинкой и ссылкой',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'шампунь', wantsImage: true, wantsLink: true },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-repair-mask',
      locale: 'ru',
      prompt: 'Создать товар для рекомендаций после оплаты Repair Mask',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'Repair Mask' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-argan-oil',
      locale: 'ru',
      prompt: 'Настроить checkout recommendation продукт Argan Oil',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'Argan Oil' },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-update-shampoo',
      locale: 'ru',
      prompt: 'Обновить recommendation product Shampoo image /uploads/shampoo.jpg',
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
      paramsPartial: { productName: 'Shampoo', imageUrl: '/uploads/shampoo.jpg', isUpdate: true },
      needsMultilingual: true,
    },
    {
      id: 'hy-link-shampoo-conditioner-haircut',
      locale: 'hy',
      prompt:
        'Առաջարկիր շամպուն և կոնդիցիոներ haircut ծառայությունից հետո',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'haircut' },
      needsMultilingual: true,
    },
    {
      id: 'hy-link-mask-color',
      locale: 'hy',
      prompt: 'Խորհուրդ տուր Repair Mask Color ծառայությունից հետո',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'Color' },
      needsMultilingual: true,
    },
    {
      id: 'hy-link-to-haircut-service',
      locale: 'hy',
      prompt: 'Կապել recommended products-ը Haircut service-ին',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'Haircut' },
      needsMultilingual: true,
    },
    {
      id: 'hy-link-checkout-color',
      locale: 'hy',
      prompt: 'Կարգավորիր checkout recommendations Color-ի համար Repair Mask',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'Color' },
      needsMultilingual: true,
    },
    {
      id: 'ru-link-shampoo-conditioner',
      locale: 'ru',
      prompt: 'Рекомендовать шампунь и кондиционер после стрижки',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'стрижки' },
      needsMultilingual: true,
    },
    {
      id: 'ru-link-mask-after-color',
      locale: 'ru',
      prompt: 'Предложи Repair Mask после услуги Color',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'Color' },
      needsMultilingual: true,
    },
    {
      id: 'ru-link-to-haircut-service',
      locale: 'ru',
      prompt: 'Привязать рекомендуемые товары к услуге стрижка',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'стрижка' },
      needsMultilingual: true,
    },
    {
      id: 'ru-link-checkout-color',
      locale: 'ru',
      prompt: 'Настроить checkout recommendations для Color на Repair Mask',
      expectedAction: 'link_recommended_products',
      rescueReason: 'link_recommended_products',
      paramsPartial: { serviceName: 'Color' },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-setup',
      locale: 'hy',
      prompt: 'Բացատրիր recommendation setup-ը',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-linked-products',
      locale: 'hy',
      prompt: 'Որ ապրանքներ են կապված post-checkout recommendations-ին',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-links-per-service',
      locale: 'hy',
      prompt: 'Ցույց տուր recommendation links-ը ծառայությունների համար',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-haircut-service',
      locale: 'hy',
      prompt: 'Բացատրիր recommendation setup-ը Haircut ծառայության համար',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      paramsPartial: { serviceName: 'Haircut' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-setup',
      locale: 'ru',
      prompt: 'Объясни настройку рекомендаций',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-linked-products',
      locale: 'ru',
      prompt: 'Какие товары привязаны к рекомендациям после оплаты',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-links-per-service',
      locale: 'ru',
      prompt: 'Покажи recommendation links по услугам',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-haircut-service',
      locale: 'ru',
      prompt: 'Опиши recommendation setup для услуги стрижка',
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
      paramsPartial: { serviceName: 'стрижка' },
      needsMultilingual: true,
    },
  ] as const;
