import {
  isConfigureBusinessDateFormatPrompt,
  isExplainBusinessDateFormatPrompt,
} from './ai-business-date-format.util.js';
import { isExplainCheckoutCurrencyPrompt } from './ai-checkout-currency.util.js';

export const BOOKING_DATE_FORMAT_INTENTS = [
  'explain_booking_date_format',
] as const;

export type BookingDateFormatIntent = (typeof BOOKING_DATE_FORMAT_INTENTS)[number];

export function isBookingDateFormatIntent(
  action: string,
): action is BookingDateFormatIntent {
  return (BOOKING_DATE_FORMAT_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasDateFormatSurface(prompt: string): boolean {
  return (
    /\b(?:date\s+format|dates?\s+(?:show|display(?:ed)?|formatted)|DD\/MM|MM\/DD|day\s+month|month\s+day|european\s+dates?|us\s+format)\b/i.test(
      prompt,
    ) ||
    /(ամսաթիվ|ամսաթվ|ձևաչափ|օր\/ամիս|ամիս\/օր|ցուցադրվ)/i.test(prompt) ||
    /(формат\s+дат|дат[аы]?|дд\/мм|мм\/дд|американск|отобража)/i.test(prompt)
  );
}

function hasBookingPageVisitorContext(prompt: string): boolean {
  return (
    /\b(booking page|booking site|this page|on this page|online booking|public booking|appointment page|when\s+(?:i\s+)?book|for bookings?)\b/i.test(
      prompt,
    ) ||
    /\b(?:here|this site|calendar)\b/i.test(prompt) ||
    /(?:էջ|կայք|գրանցման)/i.test(prompt) ||
    /(?:страниц|сайт|записи)/i.test(prompt)
  );
}

function hasDateFormatQuestionCue(prompt: string): boolean {
  return (
    /\b(why|what|which|how|explain|show|tell me|different|instead of|not in)\b/i.test(
      prompt,
    ) ||
    /(?:ինչու|ինչ|ինչպես|բացատր|ցույց)/i.test(prompt) ||
    /(?:почему|зачем|как|какой|какая|объясни|покажи)/i.test(prompt)
  );
}

function mentionsDdMmVsMmDd(prompt: string): boolean {
  return (
    /\b(?:DD\/MM|MM\/DD|dd\/mm|mm\/dd)\b/i.test(prompt) ||
    /\b(?:day\s+month|month\s+day|european\s+dates?|us\s+format)\b/i.test(
      prompt,
    ) ||
    /(?:օր\/ամիս|ամիս\/օր)/i.test(prompt) ||
    /(?:дд\/мм|мм\/дд|американск|европейск)/i.test(prompt)
  );
}

export function isExplainBookingDateFormatPrompt(prompt: string): boolean {
  if (isExplainCheckoutCurrencyPrompt(prompt)) return false;
  if (/(արժույթ|դրամ|էվրո|валют|currency)/i.test(prompt)) return false;
  if (
    isConfigureBusinessDateFormatPrompt(prompt) &&
    /\b(?:date\s+format|time\s+format|12[- ]?hour|24[- ]?hour|iso|us|european)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    isExplainBusinessDateFormatPrompt(prompt) &&
    !hasBookingPageVisitorContext(prompt)
  ) {
    return false;
  }

  if (!hasDateFormatSurface(prompt)) return false;

  const bookingContext = hasBookingPageVisitorContext(prompt);
  const questionCue = hasDateFormatQuestionCue(prompt);
  const formatContrast = mentionsDdMmVsMmDd(prompt);

  if (formatContrast && (bookingContext || questionCue)) {
    return true;
  }

  if (bookingContext && questionCue) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|ինչպես|բացատր|ցուցադրվ)/i.test(prompt) &&
      /(ամսաթիվ|ամսաթվ|ձևաչափ|էջ|կայք|գրանցման|DD\/MM|MM\/DD)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|как|какой|какая|какие|объясни|покажи|отобража)/i.test(
        prompt,
      ) &&
      /(дат[аы]?|формат|страниц|сайт|записи|дд\/мм|мм\/дд)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueBookingDateFormatIntent(
  prompt: string,
  action: string,
): { action: BookingDateFormatIntent; rescueReason: string } | null {
  if (isBookingDateFormatIntent(action)) return null;
  if (!isExplainBookingDateFormatPrompt(prompt)) return null;
  return {
    action: 'explain_booking_date_format',
    rescueReason: 'explain_booking_date_format',
  };
}
