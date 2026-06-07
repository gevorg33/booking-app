import { extractRetailPriceFromPrompt } from './ai-retail-finance.util.js';

export const RECOMMENDATION_PRODUCT_INTENTS = [
  'configure_recommendation_product',
  'link_recommended_products',
  'explain_recommendation_setup',
  'explain_recommendation_analytics',
  'summarize_recommendation_performance',
] as const;

export const RECOMMENDATION_PRODUCT_MUTATE_INTENTS = [
  'configure_recommendation_product',
  'link_recommended_products',
] as const;

export type RecommendationProductIntent =
  (typeof RECOMMENDATION_PRODUCT_INTENTS)[number];

export function isRecommendationProductIntent(
  action: string,
): action is RecommendationProductIntent {
  return (RECOMMENDATION_PRODUCT_INTENTS as readonly string[]).includes(action);
}

export interface ParsedConfigureRecommendationProduct {
  productId?: string;
  productName?: string;
  description?: string;
  imageUrl?: string;
  externalLink?: string;
  retailPrice?: number;
  wantsImage?: boolean;
  wantsLink?: boolean;
  isUpdate?: boolean;
}

function mentionsProductWord(prompt: string): boolean {
  return (
    /\bproducts?\b/i.test(prompt) ||
    /ապրանք/i.test(prompt) ||
    /(?:товар|продукт)(?:а|у|ы|ов)?/i.test(prompt)
  );
}

function hasRecommendationProductSurface(prompt: string): boolean {
  return (
    /\bpost[- ]?checkout\b/i.test(prompt) ||
    /\bcheckout\s+recommendation/i.test(prompt) ||
    /\brecommendation\s+product/i.test(prompt) ||
    /\bproduct\s+recommendation/i.test(prompt) ||
    /\bcheckout\s+recommendation\s+product/i.test(prompt) ||
    /\brecommendation\s+carousel\b/i.test(prompt) ||
    /\bafter\s+checkout\b/i.test(prompt) ||
    /\byou\s+might\s+also\s+like\b/i.test(prompt) ||
    /checkout-ից\s+հետո/i.test(prompt) ||
    /վճարումից\s+հետո/i.test(prompt) ||
    /հետո\s+oplaty|после\s+оплаты/i.test(prompt) ||
    /рекомендац/i.test(prompt) ||
    /խորհուրդ/i.test(prompt) ||
    (/\brecommendation\b/i.test(prompt) &&
      /(?:ապրանք|товар|продукт)/i.test(prompt))
  );
}

function isMutateRecommendationProductPrompt(prompt: string): boolean {
  return (
    /\b(add|create|set|update|configure|edit)\b/i.test(prompt) ||
    /(?:ավելացրու|ստեղծիր|կարգավորիր|թարմացրու)/i.test(prompt) ||
    /(?:добавить|создать|настроить|обновить)/i.test(prompt)
  );
}

function isLinkProductToServicePrompt(prompt: string): boolean {
  return (
    /\b(link|attach|connect)\b/i.test(prompt) &&
    /\bservice\b/i.test(prompt) &&
    (/\bproduct\b/i.test(prompt) || /\bto\s+.+?\s+service\b/i.test(prompt))
  );
}

function mentionsRecommendationImage(prompt: string): boolean {
  return (
    /\b(?:with\s+)?(?:an\s+)?image\b/i.test(prompt) ||
    /\bphoto\b/i.test(prompt) ||
    /\bcover\s+image\b/i.test(prompt) ||
    /նկար/i.test(prompt) ||
    /(?:картинк|изображен)/i.test(prompt)
  );
}

function mentionsRecommendationLink(prompt: string): boolean {
  if (/\blink\s+[A-Za-z][\w\s'-]+?\s+to\s+[A-Za-z]/i.test(prompt)) {
    return false;
  }
  return (
    /\b(?:external\s+)?link\b/i.test(prompt) ||
    /\bwith\s+image\s+and\s+link\b/i.test(prompt) ||
    /հղում|հղման/i.test(prompt) ||
    /(?:ссылк|линк)/i.test(prompt)
  );
}

export function isConfigureRecommendationProductPrompt(
  prompt: string,
): boolean {
  if (isLinkProductToServicePrompt(prompt)) return false;
  if (!mentionsProductWord(prompt)) return false;
  if (!isMutateRecommendationProductPrompt(prompt)) return false;

  const hasSurface = hasRecommendationProductSurface(prompt);
  const hasRecommendationMedia =
    hasSurface &&
    (mentionsRecommendationImage(prompt) || mentionsRecommendationLink(prompt));

  return (
    hasSurface ||
    (hasRecommendationMedia &&
      /\b(?:recommendation|checkout|post[- ]?checkout)\b/i.test(prompt))
  );
}

function isLikelyImageValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || ['and', 'link', 'with', 'image'].includes(trimmed))
    return false;
  return (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/') ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmed)
  );
}

function extractProductName(prompt: string): string | undefined {
  const quoted = prompt.match(/\bproduct\s+"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();

  const checkoutRecommendation = prompt.match(
    /\bcheckout\s+recommendation\s+product\s+([A-Za-z][\w\s'-]+?)(?:\s+with|\s+image|\s+link|\s+description|\s+retail|\s+external|\s*$)/i,
  );
  if (checkoutRecommendation?.[1]) return checkoutRecommendation[1].trim();

  const postCheckout = prompt.match(
    /\bpost[- ]?checkout\s+product\s+([A-Za-z][\w\s'-]+?)(?:\s+with|\s+image|\s+link|\s+description|\s+retail|\s+external|\s*$)/i,
  );
  if (postCheckout?.[1]) return postCheckout[1].trim();

  const addNamed = prompt.match(
    /\b(?:add|create)\s+(?:a\s+)?([A-Za-z][\w\s'-]+?)\s+(?:recommendation\s+)?product\b/i,
  );
  if (
    addNamed?.[1] &&
    !/^(?:post[- ]?checkout|checkout)$/i.test(addNamed[1].trim())
  ) {
    return addNamed[1].trim();
  }

  const recommendation = prompt.match(
    /\b(?:recommendation|checkout|post[- ]?checkout)\s+product\s+([A-Za-z][\w\s'-]+?)(?:\s+with|\s+image|\s+link|\s+description|\s+retail|\s+external|\s*$)/i,
  );
  if (recommendation?.[1]) return recommendation[1].trim();

  const updateNamed = prompt.match(
    /\b(?:update|set|configure|edit)\s+(?:recommendation\s+)?product\s+([A-Za-z][\w\s'-]+?)(?:\s+image|\s+link|\s+description|\s+retail|\s+external|\s+to\b|\s*$)/i,
  );
  if (updateNamed?.[1]) return updateNamed[1].trim();

  const forCheckout = prompt.match(
    /\bproduct\s+(?:for\s+)?(?:post[- ]?checkout|checkout\s+recommendation|after\s+checkout)\s+(?:called\s+)?([A-Za-z][\w\s'-]+?)(?:\s+with|\s+image|\s+link|\s*$)/i,
  );
  if (forCheckout?.[1]) return forCheckout[1].trim();

  const hyPostCheckout = prompt.match(
    /post-checkout\s+ապրանք\s+([A-Za-z][\w\s'-]+)/i,
  );
  if (hyPostCheckout?.[1]) return hyPostCheckout[1].trim();

  const hyCheckoutRecommendation = prompt.match(
    /checkout\s+recommendation\s+ապրանք\s+([A-Za-z][\w\s'-]+)/i,
  );
  if (hyCheckoutRecommendation?.[1]) return hyCheckoutRecommendation[1].trim();

  const hyAddNamed = prompt.match(
    /(?:ավելացրու|ստեղծիր|կարգավորիր)\s+([A-Za-z\u0531-\u0587][\w\u0531-\u0587\s'-]+?)\s+ապրանք/i,
  );
  if (
    hyAddNamed?.[1] &&
    !/^post[- ]?checkout$/i.test(hyAddNamed[1].trim()) &&
    !/^checkout\s+recommendation$/i.test(hyAddNamed[1].trim())
  ) {
    return hyAddNamed[1].trim();
  }

  const hyUpdate = prompt.match(
    /թարմացրու\s+recommendation\s+ապրանք\s+([A-Za-z][\w\s'-]+)/i,
  );
  if (hyUpdate?.[1]) return hyUpdate[1].trim();

  const ruCheckoutProduct = prompt.match(
    /checkout\s+recommendation\s+продукт\s+([A-Za-z][\w\s'-]+)/i,
  );
  if (ruCheckoutProduct?.[1]) return ruCheckoutProduct[1].trim();

  const ruAfterPayment = prompt.match(/после\s+оплаты\s+([A-Za-z][\w\s'-]+)/i);
  if (ruAfterPayment?.[1]) return ruAfterPayment[1].trim();

  const ruAddNamed = prompt.match(
    /(?:добавить|создать|настроить)\s+([A-Za-z\u0400-\u04FF][\w\u0400-\u04FF\s'-]+?)\s+(?:товар|продукт)/i,
  );
  if (
    ruAddNamed?.[1] &&
    !/^checkout\s+recommendation$/i.test(ruAddNamed[1].trim())
  ) {
    return ruAddNamed[1].trim();
  }

  const ruUpdate = prompt.match(
    /обновить\s+recommendation\s+product\s+([A-Za-z][\w\s'-]+)/i,
  );
  if (ruUpdate?.[1]) return ruUpdate[1].trim();

  return undefined;
}

function extractImageUrl(prompt: string): string | undefined {
  const patterns = [
    /\bimage\s+(https?:\/\/\S+)/i,
    /\bimage\s+(?:url\s+)?(?:to\s+|:)\s*["']?(\S+?)["']?(?:\s+and|\s+link|\s+description|\s+retail|\s*$)/i,
    /\bimage\s+["']([^"']+)["']/i,
    /\bwith\s+image\s+["']?(\S+?)["']?(?:\s+and|\s+link|\s*$)/i,
    /\b(?:cover\s+)?image\s+at\s+(\S+)/i,
    /(\S+)\s+as\s+(?:the\s+)?image\b/i,
    /\bimage\s+(\/\S+)/i,
    /նկարը\s+(\S+)/i,
    /(?:картинк[аи]|изображени[ея])\s+(\S+)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const value = match?.[1]?.trim();
    if (value && isLikelyImageValue(value)) return value;
  }
  return undefined;
}

function extractExternalLink(prompt: string): string | undefined {
  const patterns = [
    /\blink\s+(https?:\/\/\S+)/i,
    /\b(?:external\s+)?link\s+(?:to\s+|:)\s*["']?(\S+?)["']?(?:\s+and|\s+image|\s+description|\s+retail|\s*$)/i,
    /\bwith\s+link\s+["']?(\S+?)["']?(?:\s+and|\s+image|\s*$)/i,
    /\band\s+link\s+["']?(\S+?)["']?(?:\s+and|\s+image|\s*$)/i,
    /\bexternal\s+link\s+["']?(\S+?)["']?(?:\s+and|\s+image|\s*$)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const value = match?.[1]?.trim();
    if (value && /^https?:\/\//i.test(value)) return value;
  }
  return undefined;
}

function extractDescription(prompt: string): string | undefined {
  const quoted = prompt.match(/\bdescription\s+"([^"]+)"/i);
  if (quoted?.[1]) return quoted[1].trim();
  const bare = prompt.match(
    /\bdescription\s+([^"'\n]+?)(?:\s+retail|\s+image|\s+link|\s*$)/i,
  );
  return bare?.[1]?.trim() || undefined;
}

export function parseConfigureRecommendationProductFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureRecommendationProduct | null {
  if (!isConfigureRecommendationProductPrompt(prompt)) return null;

  const productId =
    typeof params.productId === 'string' ? params.productId.trim() : undefined;
  const productNameFromParams =
    typeof params.productName === 'string'
      ? params.productName.trim()
      : typeof params.name === 'string'
        ? params.name.trim()
        : undefined;
  const productName = productNameFromParams || extractProductName(prompt);

  const descriptionFromParams =
    typeof params.description === 'string'
      ? params.description.trim()
      : undefined;
  const description = descriptionFromParams ?? extractDescription(prompt);

  const imageUrlFromParams =
    typeof params.imageUrl === 'string' ? params.imageUrl.trim() : undefined;
  const imageUrl = imageUrlFromParams ?? extractImageUrl(prompt);

  const externalLinkFromParams =
    typeof params.externalLink === 'string'
      ? params.externalLink.trim()
      : undefined;
  const externalLink = externalLinkFromParams ?? extractExternalLink(prompt);

  const retailPriceFromParams =
    typeof params.retailPrice === 'number'
      ? params.retailPrice
      : typeof params.retailPrice === 'string'
        ? Number(params.retailPrice)
        : typeof params.price === 'number'
          ? params.price
          : undefined;
  const retailPrice =
    Number.isFinite(retailPriceFromParams) && retailPriceFromParams! >= 0
      ? retailPriceFromParams!
      : (extractRetailPriceFromPrompt(prompt) ?? undefined);

  const wantsImage =
    params.wantsImage === true ||
    (mentionsRecommendationImage(prompt) && !imageUrl);
  const wantsLink =
    params.wantsLink === true ||
    (mentionsRecommendationLink(prompt) && !externalLink);

  const isUpdate =
    params.isUpdate === true ||
    /\b(update|set|configure|edit)\b/i.test(prompt) ||
    /թարմացրու/i.test(prompt) ||
    /обновить/i.test(prompt);

  return {
    productId,
    productName,
    description,
    imageUrl,
    externalLink,
    retailPrice,
    wantsImage: wantsImage || undefined,
    wantsLink: wantsLink || undefined,
    isUpdate: isUpdate || undefined,
  };
}

export interface ParsedLinkRecommendedProducts {
  productNames: string[];
  productIds?: string[];
  serviceId?: string;
  serviceName?: string;
  categoryId?: string;
  categoryName?: string;
}

function splitProductNames(text: string): string[] {
  const normalized = text.replace(/,\s+and\s+/gi, ', ');
  return normalized
    .split(/\s*,\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function extractRecommendedProductNames(prompt: string): string[] {
  const quotedList = prompt.match(/\bproducts?\s+"([^"]+)"/i);
  if (quotedList?.[1]) return splitProductNames(quotedList[1]);

  const recommendList = prompt.match(
    /\b(?:recommend|suggest)\s+(.+?)\s+(?:after|for|following)\s+(?:the\s+)?/i,
  );
  if (recommendList?.[1]) return splitProductNames(recommendList[1]);

  const linkList = prompt.match(
    /\b(?:recommended|recommendation|checkout)\s+products?\s+(.+?)\s+to\s+/i,
  );
  if (linkList?.[1]) return splitProductNames(linkList[1]);

  const checkoutFor = prompt.match(
    /\bcheckout\s+recommendations?\s+for\s+([A-Za-z][\w\s'-]+?)\s+to\s+(.+?)(?:\s*$)/i,
  );
  if (checkoutFor?.[2]) return splitProductNames(checkoutFor[2]);

  const setCheckout = prompt.match(
    /\bset\s+checkout\s+recommendations?\s+(?:for|on)\s+([A-Za-z][\w\s'-]+?)\s+to\s+(.+?)(?:\s*$)/i,
  );
  if (setCheckout?.[2]) return splitProductNames(setCheckout[2]);

  const attachList = prompt.match(
    /\battach\s+checkout\s+recommendation\s+products?\s+(.+?)\s+to\s+/i,
  );
  if (attachList?.[1]) return splitProductNames(attachList[1]);

  const hyRecommend = prompt.match(
    /(?:առաջարկիր|խորհուրդ\s+տուր)\s+(.+)\s+ծառայությունից\s+հետո/i,
  );
  if (hyRecommend?.[1]) {
    const serviceTail = hyRecommend[1].match(/\S+$/);
    const productPart = serviceTail
      ? hyRecommend[1].slice(0, -serviceTail[0].length).trim()
      : hyRecommend[1].trim();
    if (productPart) return splitProductNames(productPart);
  }

  const hyCheckoutFor = prompt.match(
    /checkout\s+recommendations?\s+(.+?)-ի\s+համար\s+(.+?)(?:\s*$)/i,
  );
  if (hyCheckoutFor?.[2]) return splitProductNames(hyCheckoutFor[2]);

  const ruRecommend = prompt.match(
    /(?:рекомендовать|рекомендуй|предложи)\s+(.+?)\s+после/i,
  );
  if (ruRecommend?.[1]) return splitProductNames(ruRecommend[1]);

  const ruCheckoutFor = prompt.match(
    /checkout\s+recommendations?\s+для\s+.+?\s+на\s+(.+?)(?:\s*$)/i,
  );
  if (ruCheckoutFor?.[1]) return splitProductNames(ruCheckoutFor[1]);

  if (/կապել\s+recommended\s+products?/i.test(prompt)) {
    return ['recommended products'];
  }
  if (/привязать\s+рекомендуемые\s+товары/i.test(prompt)) {
    return ['рекомендуемые товары'];
  }

  return [];
}

function extractRecommendationTarget(prompt: string): {
  serviceName?: string;
  categoryName?: string;
} {
  const checkoutForService = prompt.match(
    /\bcheckout\s+recommendations?\s+for\s+([A-Za-z][\w\s'-]+?)\s+to\s+/i,
  );
  if (checkoutForService?.[1]) {
    return { serviceName: checkoutForService[1].trim() };
  }

  const setCheckoutService = prompt.match(
    /\bset\s+checkout\s+recommendations?\s+(?:for|on)\s+([A-Za-z][\w\s'-]+?)\s+to\s+/i,
  );
  if (setCheckoutService?.[1]) {
    return { serviceName: setCheckoutService[1].trim() };
  }

  const afterService = prompt.match(
    /\b(?:after|for|following)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
  );
  if (afterService?.[1]) return { serviceName: afterService[1].trim() };

  const toService = prompt.match(
    /\bto\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
  );
  if (toService?.[1]) return { serviceName: toService[1].trim() };

  const forCategory = prompt.match(
    /\b(?:after|for|on)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+category\b/i,
  );
  if (forCategory?.[1]) return { categoryName: forCategory[1].trim() };

  const hyAfterService = prompt.match(/(\S+)\s+ծառայությունից\s+հետո/i);
  if (hyAfterService?.[1]) return { serviceName: hyAfterService[1].trim() };

  const hyServiceFor = prompt.match(
    /([A-Za-z][\w\s'-]+?)\s+ծառայության\s+համար/i,
  );
  if (hyServiceFor?.[1]) return { serviceName: hyServiceFor[1].trim() };

  const hyCheckoutService = prompt.match(
    /checkout\s+recommendations?\s+([A-Za-z][\w\s'-]+?)-ի\s+համար/i,
  );
  if (hyCheckoutService?.[1]) {
    return { serviceName: hyCheckoutService[1].trim() };
  }

  const hyLinkService = prompt.match(
    /recommended\s+products?-ը\s+([A-Za-z][\w\s'-]+)\s+service/i,
  );
  if (hyLinkService?.[1]) return { serviceName: hyLinkService[1].trim() };

  const ruAfterService = prompt.match(
    /после\s+(?:услуги\s+)?([A-Za-z\u0400-\u04FF][\w\u0400-\u04FF'-]+)/i,
  );
  if (ruAfterService?.[1]) return { serviceName: ruAfterService[1].trim() };

  const ruToService = prompt.match(
    /к\s+услуге\s+([A-Za-z\u0400-\u04FF][\w\u0400-\u04FF'-]+)/i,
  );
  if (ruToService?.[1]) return { serviceName: ruToService[1].trim() };

  const ruCheckoutService = prompt.match(
    /checkout\s+recommendations?\s+для\s+([A-Za-z][\w\s'-]+)/i,
  );
  if (ruCheckoutService?.[1])
    return { serviceName: ruCheckoutService[1].trim() };

  const ruSetupService = prompt.match(
    /для\s+услуги\s+([A-Za-z\u0400-\u04FF][\w\u0400-\u04FF'-]+)/i,
  );
  if (ruSetupService?.[1]) return { serviceName: ruSetupService[1].trim() };

  return {};
}

function hasExplainReadCue(prompt: string): boolean {
  return (
    /\b(explain|show|describe|what|which|how|summarize|overview|status)\b/i.test(
      prompt,
    ) ||
    /(?:բացատրիր|ցույց\s+տուր)/i.test(prompt) ||
    /(?:^|[\s,.])որ\s+ապրանք/i.test(prompt) ||
    /(?:объясни|покажи|опиши|какие|какой)/i.test(prompt)
  );
}

function hasRecommendationSetupSurface(prompt: string): boolean {
  return (
    /\brecommendation\s+setup\b/i.test(prompt) ||
    /\bcheckout\s+recommendations?\b/i.test(prompt) ||
    /\bpost[- ]?checkout\s+recommendations?\b/i.test(prompt) ||
    /\brecommended\s+products?\b/i.test(prompt) ||
    /\brecommendation\s+products?\b/i.test(prompt) ||
    /\brecommendation\s+links?\b/i.test(prompt) ||
    /\bproducts?\s+(?:are\s+)?linked\b/i.test(prompt) ||
    /\byou\s+might\s+also\s+like\b/i.test(prompt) ||
    /ապրանքներ\s+են\s+կապված/i.test(prompt) ||
    /настройк[аи]\s+рекомендац/i.test(prompt) ||
    /товар[ыа]?\s+привязан/i.test(prompt) ||
    /рекомендац/i.test(prompt)
  );
}

function hasCheckoutSuccessVisitorContext(prompt: string): boolean {
  return (
    /\byou\s+might\s+also\s+like\b/i.test(prompt) ||
    /\b(?:booking\s+)?(?:success|confirmation)\s+(?:screen|page)\b/i.test(
      prompt,
    ) ||
    /\bafter\s+(?:i\s+)?booked\b/i.test(prompt) ||
    /\bjust\s+booked\b/i.test(prompt) ||
    /\bon\s+checkout\s+success\b/i.test(prompt) ||
    /\bconsumer\s+app\s+success\b/i.test(prompt)
  );
}

export function isExplainRecommendationSetupPrompt(prompt: string): boolean {
  if (
    /\b(?:recommendation\s+analytics|product_recommendation\.(?:shown|clicked)|recommendation\s+(?:events?|impressions?|clicks?|stats?|metrics?))\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\bcheckout\s+recommendation\s+events?\b/i.test(prompt) ||
    /\b(?:shown|clicked)\s+(?:counts?|events?)\b/i.test(prompt)
  ) {
    return false;
  }
  if (hasCheckoutSuccessVisitorContext(prompt)) return false;
  if (!hasExplainReadCue(prompt)) return false;
  if (
    isMutateRecommendationProductPrompt(prompt) &&
    mentionsProductWord(prompt) &&
    hasRecommendationProductSurface(prompt) &&
    !hasRecommendationSetupSurface(prompt)
  ) {
    return false;
  }
  if (
    /\b(list|create|add|set|update|link|attach)\s+(?:retail\s+)?products?\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  const hasAdminSetupVoice =
    /\b(?:recommendation\s+setup|checkout\s+recommendations?|post[- ]?checkout\s+recommendations?)\b/i.test(
      prompt,
    ) ||
    /\bproducts?\s+(?:are\s+)?linked\b/i.test(prompt) ||
    /\bwhich\s+products?\s+(?:are\s+)?recommended\b/i.test(prompt) ||
    /\bactive\s+products?\b.+\bcheckout\s+recommendations?\b/i.test(prompt) ||
    /\brecommendation\s+links?\b/i.test(prompt) ||
    /ապրանքներ\s+են\s+կապված/i.test(prompt) ||
    /настройк[аиуюе]\s+рекомендац/i.test(prompt) ||
    /товар[ыа]?\s+привязан/i.test(prompt) ||
    /какие\s+товар/i.test(prompt) ||
    /(?:^|[\s,.])որ\s+ապրանք/i.test(prompt);

  if (!hasAdminSetupVoice) return false;

  return (
    hasRecommendationSetupSurface(prompt) ||
    (/\brecommendation\b/i.test(prompt) &&
      /\b(?:setup|configuration|configured|links?)\b/i.test(prompt)) ||
    (/\bwhich\s+products?\b/i.test(prompt) &&
      /\b(?:linked|recommended)\b/i.test(prompt))
  );
}

export function isLinkRecommendedProductsPrompt(prompt: string): boolean {
  if (hasExplainReadCue(prompt)) return false;
  if (
    hasRecommendationProductSurface(prompt) &&
    isMutateRecommendationProductPrompt(prompt) &&
    mentionsProductWord(prompt)
  ) {
    return false;
  }
  if (/\b(booking|appointment|upsell|retail\s+sale)\b/i.test(prompt)) {
    return false;
  }

  const hasSurface =
    (/\b(recommend|suggest)\b/i.test(prompt) &&
      /\b(?:after|for|following)\b/i.test(prompt) &&
      /\b(?:service|category)\b/i.test(prompt)) ||
    (/(?:առաջարկիր|խորհուրդ\s+տուր)/i.test(prompt) &&
      /ծառայությունից\s+հետո/i.test(prompt)) ||
    (/(?:рекомендовать|рекомендуй|предложи)/i.test(prompt) &&
      /после/i.test(prompt)) ||
    (/\b(link|attach|set)\b/i.test(prompt) &&
      /\b(?:recommended|recommendation|checkout)\b/i.test(prompt)) ||
    (/(?:կապել|կարգավորիր)/i.test(prompt) &&
      /\b(?:recommended|recommendation|checkout)\b/i.test(prompt)) ||
    (/(?:привязать|настроить)/i.test(prompt) &&
      (/\b(?:recommended|recommendation|checkout)\b/i.test(prompt) ||
        /рекомендуем/i.test(prompt))) ||
    /\bcheckout\s+recommendations?\s+(?:for|on)\b/i.test(prompt) ||
    /checkout\s+recommendations?\s+.+\s+համար/i.test(prompt) ||
    /checkout\s+recommendations?\s+для/i.test(prompt);

  if (!hasSurface) return false;

  if (
    isLinkProductToServicePrompt(prompt) &&
    !/\b(?:recommended|recommendation|checkout|post[- ]?checkout)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  const productNames = extractRecommendedProductNames(prompt);
  const target = extractRecommendationTarget(prompt);
  return (
    productNames.length > 0 &&
    Boolean(target.serviceName || target.categoryName)
  );
}

export function parseLinkRecommendedProductsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedLinkRecommendedProducts | null {
  if (!isLinkRecommendedProductsPrompt(prompt)) return null;

  const productNamesFromParams = Array.isArray(params.productNames)
    ? params.productNames
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    : typeof params.productName === 'string'
      ? [params.productName.trim()]
      : [];
  const productNames =
    productNamesFromParams.length > 0
      ? productNamesFromParams
      : extractRecommendedProductNames(prompt);

  const productIds = Array.isArray(params.productIds)
    ? params.productIds
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;

  const target = extractRecommendationTarget(prompt);
  const serviceName =
    (typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined) ?? target.serviceName;
  const categoryName =
    (typeof params.categoryName === 'string'
      ? params.categoryName.trim()
      : undefined) ?? target.categoryName;
  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const categoryId =
    typeof params.categoryId === 'string'
      ? params.categoryId.trim()
      : undefined;

  return {
    productNames,
    productIds,
    serviceId,
    serviceName,
    categoryId,
    categoryName,
  };
}

export interface ParsedExplainRecommendationSetup {
  serviceId?: string;
  serviceName?: string;
  categoryId?: string;
  categoryName?: string;
}

function extractExplainServiceFilter(prompt: string): string | undefined {
  const patterns = [
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
    /\bafter\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
    /\bon\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
    /\brecommendation\s+setup\s+for\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
    /([A-Za-z][\w\s'-]+?)\s+ծառայության\s+համար/i,
    /для\s+услуги\s+([A-Za-z\u0400-\u04FF][\w\u0400-\u04FF'-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function extractExplainCategoryFilter(prompt: string): string | undefined {
  const patterns = [
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+category\b/i,
    /\brecommendation\s+setup\s+for\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+category\b/i,
    /\bpost[- ]?checkout\s+recommendation\s+setup\s+for\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+category\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

export function parseExplainRecommendationSetupFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainRecommendationSetup | null {
  if (!isExplainRecommendationSetupPrompt(prompt)) return null;

  const serviceName =
    (typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined) ?? extractExplainServiceFilter(prompt);
  const categoryName =
    (typeof params.categoryName === 'string'
      ? params.categoryName.trim()
      : undefined) ?? extractExplainCategoryFilter(prompt);
  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const categoryId =
    typeof params.categoryId === 'string'
      ? params.categoryId.trim()
      : undefined;

  return {
    serviceId,
    serviceName,
    categoryId,
    categoryName,
  };
}

/** NL rescue when classifier mislabels recommendation setup explain prompts. */
export function rescueExplainRecommendationSetupIntent(
  prompt: string,
  action: string,
): { action: RecommendationProductIntent; rescueReason: string } | null {
  if (isRecommendationProductIntent(action)) return null;
  if (!isExplainRecommendationSetupPrompt(prompt)) return null;
  return {
    action: 'explain_recommendation_setup',
    rescueReason: 'explain_recommendation_setup',
  };
}

/** NL rescue when classifier mislabels post-checkout recommendation link prompts. */
export function rescueLinkRecommendedProductsIntent(
  prompt: string,
  action: string,
): { action: RecommendationProductIntent; rescueReason: string } | null {
  if (isRecommendationProductIntent(action)) return null;
  if (!isLinkRecommendedProductsPrompt(prompt)) return null;

  const parsed = parseLinkRecommendedProductsFromPrompt(prompt);
  if (
    !parsed ||
    parsed.productNames.length === 0 ||
    (!parsed.serviceName &&
      !parsed.serviceId &&
      !parsed.categoryName &&
      !parsed.categoryId)
  ) {
    return null;
  }

  return {
    action: 'link_recommended_products',
    rescueReason: 'link_recommended_products',
  };
}

/** NL rescue when classifier mislabels post-checkout recommendation product prompts. */
export function rescueConfigureRecommendationProductIntent(
  prompt: string,
  action: string,
): { action: RecommendationProductIntent; rescueReason: string } | null {
  if (isRecommendationProductIntent(action)) return null;
  if (!isConfigureRecommendationProductPrompt(prompt)) return null;

  const parsed = parseConfigureRecommendationProductFromPrompt(prompt);
  if (!parsed?.productName && !parsed?.productId) return null;

  return {
    action: 'configure_recommendation_product',
    rescueReason: 'configure_recommendation_product',
  };
}
