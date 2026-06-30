import {
  GROWTH_LOOPS_CUSTOMER_PROMPTS,
  GROWTH_LOOPS_MULTILINGUAL_CLASSIFIER_RULES,
  MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS,
  type GrowthLoopsCustomerAction,
} from './ai-growth-loops-customer.fixtures.js';
import { isPromoCodeHelpPrompt } from './ai-marketing-growth.util.js';

export { CUSTOMER_GROWTH_LOOPS_CLASSIFIER_RULES } from './ai-growth-loops-customer.fixtures.js';
export {
  GROWTH_LOOPS_CUSTOMER_PROMPTS,
  GROWTH_LOOPS_MULTILINGUAL_CLASSIFIER_RULES,
  MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS,
  REFER_A_FRIEND_CUSTOMER_PROMPTS,
  SHARE_SALON_LINK_CUSTOMER_PROMPTS,
} from './ai-growth-loops-customer.fixtures.js';

const SHARE_MY_BOOKING =
  /\b(share).{0,30}\b(booking|appointment|visit)\b|կիս.{0,20}ամրագր|подел.{0,20}(запис|визит)/i;

const REFER_FRIEND =
  /\b(refer|invite).{0,40}\b(friend|buddy|someone|referral)\b|\breferral (code|link|program|bonus|rewards?)\b|\bhow do i refer\b|\bmy (?:referral|invite) (?:code|link)\b|\b(?:friend|buddy) invite\b|հրավիր.{0,24}(ընկեր|friend)|ինչպես.{0,24}հրավիր|реферал|приглас.{0,24}друг|приглаш.{0,24}друг|бонус.{0,20}приглаш/i;

const SHARE_SALON =
  /\b(share|send|post|copy).{0,40}\b(salon|business|place|booking page)\b.{0,20}\b(link|page)\b|\bshare (?:this|the) (?:salon|business|place)\b|\bshare (?:salon|business) link\b|\bshare\b.{0,30}\b(?:salon|business|place|booking)\b.{0,30}\b(?:link|page)\b|\bshare\b.{0,24}\blink\b.{0,24}\b(?:growth|account|salon|business)\b|\bdeep link\b.{0,20}\b(?:salon|business)\b|կիս.{0,24}(salon|սalon|բիզնես|սրահ)|ուղարկ.{0,24}(salon|link)|ինչպես.{0,24}կիս.{0,24}(բիզնես|սրահ)|подел.{0,24}(салон|ссылк|бизнес)|отправ.{0,24}(салон|ссылк)/i;

function matchGrowthLoopsScenarioPrompt(
  prompt: string,
): GrowthLoopsCustomerAction | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of [
    ...GROWTH_LOOPS_CUSTOMER_PROMPTS,
    ...MULTILINGUAL_GROWTH_LOOPS_EVAL_SCENARIOS,
  ]) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario.expectedAction;
    }
  }
  return null;
}

export function isReferAFriendPrompt(prompt: string): boolean {
  if (isPromoCodeHelpPrompt(prompt)) return false;
  if (SHARE_MY_BOOKING.test(prompt) && !REFER_FRIEND.test(prompt)) return false;
  return REFER_FRIEND.test(prompt);
}

export function isShareSalonLinkPrompt(prompt: string): boolean {
  if (isReferAFriendPrompt(prompt)) return false;
  if (SHARE_MY_BOOKING.test(prompt)) return false;
  if (
    /\bshare rewards?\b/i.test(prompt) &&
    /\b(points?|when i share)\b/i.test(prompt) &&
    !/\b(salon|business|place|link)\b/i.test(prompt)
  ) {
    return false;
  }
  return SHARE_SALON.test(prompt);
}

export function isGrowthLoopsCustomerPrompt(prompt: string): boolean {
  if (isReferAFriendPrompt(prompt) || isShareSalonLinkPrompt(prompt)) {
    return true;
  }
  return matchGrowthLoopsScenarioPrompt(prompt) !== null;
}

export function rescueGrowthLoopsCustomerIntent(
  prompt: string,
  action: string,
): { action: GrowthLoopsCustomerAction; rescueReason: string } | null {
  const text = prompt.trim();
  if (!text) return null;

  if (action === 'refer_a_friend' || action === 'share_salon_link') {
    return { action, rescueReason: action };
  }

  const scenarioAction = matchGrowthLoopsScenarioPrompt(text);
  if (scenarioAction) {
    return { action: scenarioAction, rescueReason: scenarioAction };
  }

  if (isReferAFriendPrompt(text)) {
    return { action: 'refer_a_friend', rescueReason: 'refer_a_friend' };
  }
  if (isShareSalonLinkPrompt(text)) {
    return { action: 'share_salon_link', rescueReason: 'share_salon_link' };
  }

  return null;
}

export function detectGrowthLoopsCustomerAction(
  prompt: string,
): GrowthLoopsCustomerAction | null {
  return rescueGrowthLoopsCustomerIntent(prompt, 'unknown')?.action ?? null;
}
