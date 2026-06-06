export const CONSUMER_CHECKOUT_SUCCESS_INTENTS = [
  'explain_consumer_checkout_success',
] as const;

export type ConsumerCheckoutSuccessIntent =
  (typeof CONSUMER_CHECKOUT_SUCCESS_INTENTS)[number];

export type ConsumerCheckoutSuccessAspect =
  | 'summary'
  | 'actions'
  | 'recommendations'
  | 'dismiss'
  | 'all';

export interface ParsedExplainConsumerCheckoutSuccess {
  serviceId?: string;
  serviceName?: string;
  bookingId?: string;
  aspect: ConsumerCheckoutSuccessAspect;
}

export function isConsumerCheckoutSuccessIntent(
  action: string,
): action is ConsumerCheckoutSuccessIntent {
  return (CONSUMER_CHECKOUT_SUCCESS_INTENTS as readonly string[]).includes(
    action,
  );
}

function hasReadConsumerCheckoutSuccessCue(prompt: string): boolean {
  return (
    /\b(what|which|how|why|does|do|is|are|can|tell|explain|show|describe|mean|meaning|walk)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim())
  );
}

export function hasConsumerAppContext(prompt: string): boolean {
  return (
    /\b(consumer app|salon app|mobile app|the app|in-app|in the app|in this app|this app)\b/i.test(
      prompt,
    ) ||
    /\bafter (?:i |you )?(?:book|confirm|finish)(?:ed)?\b.+\b(?:in the app|in-app|the app)\b/i.test(
      prompt,
    ) ||
    /\b(?:book(?:ing)?|confirm(?:ing)?)\s+in the app\b/i.test(prompt) ||
    /\bconsumer\s+app\s+success\b/i.test(prompt) ||
    /\bon the app\b/i.test(prompt)
  );
}

function hasConsumerCheckoutSuccessTopic(prompt: string): boolean {
  return (
    /\b(booking\s+)?(?:confirmed|confirmation|success)\s+(?:screen|page)\b/i.test(
      prompt,
    ) ||
    /\b(?:checkout|booking)\s+success\b/i.test(prompt) ||
    /\bsuccess screen\b/i.test(prompt) ||
    /\bview appointments\b/i.test(prompt) ||
    /\bbook another(?: service)?\b/i.test(prompt) ||
    /\b(?:green\s+)?checkmark\b/i.test(prompt) ||
    /\bwhat (?:can i|to) do next\b/i.test(prompt) ||
    /\bwhen (?:do|does|is)\b.+\b(?:product cards?|recommendations? section|you might also like)\b/i.test(
      prompt,
    ) ||
    /\b(?:product cards?|recommendations? section)\b.+\b(?:appear|show|visible|hidden|before)\b/i.test(
      prompt,
    ) ||
    /\bno recommendations section\b/i.test(prompt) ||
    /\bwalk me through\b.+\b(?:success|after (?:i |you )?(?:book|finish))/i.test(
      prompt,
    ) ||
    /\bmanage this appointment from your account\b/i.test(prompt) ||
    /\bconfirmation summary\b/i.test(prompt) ||
    /\bappointment time\b.+\bsuccess\b/i.test(prompt) ||
    /\bpayment summary\b/i.test(prompt) ||
    /\bdismiss recommendations?\b/i.test(prompt) ||
    /\b(?:hide|close)\b.+\b(?:you might also like|recommendations?|product cards?)\b/i.test(
      prompt,
    ) ||
    /\b(?:you might also like|recommendations? section)\b.+\b(?:disappear|hidden|hide|dismiss|close)\b/i.test(
      prompt,
    ) ||
    /\b(?:x button|close button)\b.+\b(?:you might also like|recommendations?)\b/i.test(
      prompt,
    ) ||
    /\bwhat (?:stays|remains)\b.+\b(?:screen|success)\b/i.test(prompt) ||
    /\bwhat happens when i dismiss\b/i.test(prompt) ||
    /\b(?:when i|if i) dismiss\b/i.test(prompt) ||
    /\bdismissing recommendations?\b/i.test(prompt) ||
    /\b(?:x button|close button)\b/i.test(prompt) ||
    /\brecommended products\b/i.test(prompt) ||
    /\bconfirmation page\b/i.test(prompt) ||
    /\bright after confirming\b/i.test(prompt) ||
    /\bafter i book\b/i.test(prompt)
  );
}

function isProductRecommendationDetailPrompt(prompt: string): boolean {
  if (
    /\bwhen (?:do|does|is)\b/i.test(prompt) &&
    /\b(?:product cards?|recommendations? section|you might also like)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  return (
    /\b(?:which|what)\s+products?\b/i.test(prompt) ||
    /\bwhy am i seeing\b/i.test(prompt) ||
    /\b(?:shop|external)\s+links?\b/i.test(prompt) ||
    /\bhow (?:were|were these)\b.+\b(?:chosen|picked|selected)\b/i.test(
      prompt,
    ) ||
    /\bfrom my booked\b/i.test(prompt) ||
    /\bhow many products can appear\b/i.test(prompt) ||
    /\bmax(?:imum)?\s+(?:product|card)\s+count\b/i.test(prompt) ||
    /\brecommended\s+here\b/i.test(prompt) ||
    (/\byou might also like\b/i.test(prompt) &&
      /\b(?:what|which|why|mean|products?|shop)\b/i.test(prompt) &&
      !/\b(?:x button|close button|dismiss|hide|close)\b/i.test(prompt))
  );
}

function isDismissActionNotExplainPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (
    /^(?:dismiss|hide|close)\s+(?:the\s+)?(?:recommendations?|you might also like|product cards?)\b/i.test(
      trimmed,
    ) &&
    !hasReadConsumerCheckoutSuccessCue(prompt)
  ) {
    return true;
  }
  return false;
}

function isNavigationNotExplainPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (
    /^(?:show|list|open|view)\s+my\s+appointments?\b/i.test(trimmed) &&
    !/\b(?:what|how|explain|does|do|mean)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(?:take me to|go to|navigate to)\s+(?:my\s+)?appointments?\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /^(?:book another|book a)\b/i.test(trimmed) &&
    !/\b(?:what|how|explain|does|do|mean)\b/i.test(prompt)
  ) {
    return true;
  }
  return false;
}

function extractAspect(prompt: string): ConsumerCheckoutSuccessAspect {
  if (
    /\bdismiss recommendations?\b/i.test(prompt) ||
    /\b(?:hide|close)\b.+\b(?:you might also like|recommendations?|product cards?)\b/i.test(
      prompt,
    ) ||
    /\b(?:you might also like|recommendations? section|recommended products)\b.+\b(?:disappear|hidden|hide|dismiss|close)\b/i.test(
      prompt,
    ) ||
    /\b(?:x button|close button)\b/i.test(prompt) ||
    /\bwhat (?:stays|remains)\b.+\b(?:screen|success)\b/i.test(prompt) ||
    /\bwhat happens when i dismiss\b/i.test(prompt) ||
    /\b(?:when i|if i) dismiss\b/i.test(prompt) ||
    /\bdoes dismissing\b/i.test(prompt) ||
    /\bdismiss(?:ing)?\b.+\b(?:product cards?|recommendations?)\b/i.test(
      prompt,
    ) ||
    (/\brecommended products\b/i.test(prompt) && /\bdisappear\b/i.test(prompt)) ||
    (/\bwhen (?:is|does)\b/i.test(prompt) &&
      /\byou might also like\b/i.test(prompt) &&
      /\bhidden\b/i.test(prompt))
  ) {
    return 'dismiss';
  }
  if (
    /\bwhen (?:do|does|is)\b/i.test(prompt) &&
    /\b(?:product cards?|recommendations? section|you might also like)\b/i.test(
      prompt,
    )
  ) {
    return 'recommendations';
  }
  if (
    /\b(?:product cards?|recommendations? section)\b.+\b(?:appear|show|visible|hidden|before)\b/i.test(
      prompt,
    ) ||
    /\bno recommendations section\b/i.test(prompt)
  ) {
    return 'recommendations';
  }
  if (
    /\bview appointments\b/i.test(prompt) ||
    /\bbook another(?: service)?\b/i.test(prompt) ||
    /\bwhat (?:can i|to) do next\b/i.test(prompt) ||
    /\baction buttons?\b/i.test(prompt)
  ) {
    return 'actions';
  }
  if (
    /\b(?:green\s+)?checkmark\b/i.test(prompt) ||
    /\bconfirmation summary\b/i.test(prompt) ||
    /\bconfirmation page\b/i.test(prompt) ||
    /\bright after confirming\b/i.test(prompt) ||
    /\bappointment time\b/i.test(prompt) ||
    /\bpayment summary\b/i.test(prompt) ||
    /\bmanage this appointment from your account\b/i.test(prompt) ||
    /\bwhat is shown\b/i.test(prompt) ||
    /\bwhat should i see\b/i.test(prompt)
  ) {
    return 'summary';
  }
  if (
    /\bhow do i get\b.+\bappointments?\b/i.test(prompt) ||
    /\bhow do i start another booking\b/i.test(prompt)
  ) {
    return 'actions';
  }
  return 'all';
}

export function isExplainConsumerCheckoutSuccessPrompt(prompt: string): boolean {
  if (!hasReadConsumerCheckoutSuccessCue(prompt)) return false;
  if (!hasConsumerAppContext(prompt)) return false;
  if (
    /\b(tax|vat|gst|pst|incl\.?|tax\s+line|tax\s+breakdown|payment\s+summary)\b/i.test(
      prompt,
    ) &&
    /\b(?:badge|service\s+list|service\s+cards?|checkout|pay(?:ing)?)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (isProductRecommendationDetailPrompt(prompt)) return false;
  if (isDismissActionNotExplainPrompt(prompt)) return false;
  if (isNavigationNotExplainPrompt(prompt)) return false;
  if (!hasConsumerCheckoutSuccessTopic(prompt)) return false;
  return true;
}

export function parseExplainConsumerCheckoutSuccessFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainConsumerCheckoutSuccess | null {
  if (!isExplainConsumerCheckoutSuccessPrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const bookingId =
    typeof params.bookingId === 'string' ? params.bookingId.trim() : undefined;
  const serviceName =
    typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined;
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams &&
    ['summary', 'actions', 'recommendations', 'dismiss', 'all'].includes(
      aspectFromParams,
    )
      ? (aspectFromParams as ConsumerCheckoutSuccessAspect)
      : extractAspect(prompt);

  return {
    serviceId,
    serviceName,
    bookingId,
    aspect,
  };
}

export function rescueExplainConsumerCheckoutSuccessIntent(
  prompt: string,
  action: string,
): { action: ConsumerCheckoutSuccessIntent; rescueReason: string } | null {
  if (isConsumerCheckoutSuccessIntent(action)) return null;
  if (!isExplainConsumerCheckoutSuccessPrompt(prompt)) return null;
  return {
    action: 'explain_consumer_checkout_success',
    rescueReason: 'explain_consumer_checkout_success',
  };
}
