import { isExplainNotificationCurrencyPrompt } from './ai-notification-currency.util.js';

export const NOTIFICATION_DATE_FORMAT_INTENTS = [
  'explain_notification_date_format',
  'preview_notification_datetime',
  'notify_patient_result_ready',
] as const;

export const NOTIFICATION_DATE_FORMAT_MUTATE_INTENTS = [
  'notify_patient_result_ready',
] as const;

export type NotificationDateFormatIntent =
  (typeof NOTIFICATION_DATE_FORMAT_INTENTS)[number];

export type NotificationMessageKind =
  | 'confirmation'
  | 'reminder'
  | 'gift_card'
  | 'cancellation';

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasNotificationDateContext(prompt: string): boolean {
  return (
    /\b(booking\s+confirmation|appointment\s+reminder|gift\s*card\s+(?:emails?|confirmation|receipt|purchase\s+emails?|messages?|expiry))\b/i.test(
      prompt,
    ) ||
    /\b(?:booking\s+)?confirmation\s+messages?\b/i.test(prompt) ||
    /\bgift\s*card\s+emails?\b/i.test(prompt) ||
    /\b(confirmation|reminder|cancellation)\s+(?:emails?|messages?|texts?|sms|whatsapp)\b/i.test(
      prompt,
    ) ||
    (/\b(confirmation|reminder|notification|gift\s*card|cancellation)\b/i.test(
      prompt,
    ) &&
      /\b(emails?|e-mails?|whatsapp|what'?s?\s*app|sms|text\s*messages?|messages?|sent|received)\b/i.test(
        prompt,
      )) ||
    (/\b(emails?|e-mails?|whatsapp|what'?s?\s*app|sms)\b/i.test(prompt) &&
      /\b(confirmation|reminder|booking|appointment|gift\s*card|cancellation)\b/i.test(
        prompt,
      )) ||
    /\bnotification\s+emails?\b/i.test(prompt) ||
    /(?:նամակ|հաստատում|հիշեցում|whatsapp|հաղորդագր)/i.test(prompt) ||
    /(?:письм|подтвержден|напоминан|whatsapp|сообщен)/i.test(prompt)
  );
}

function hasDateTimeFormatCue(prompt: string): boolean {
  return (
    /\b(?:date\s+format|time\s+format|dates?\s+(?:show(?:n)?|display(?:ed)?|formatted|format)|show\s+dates?|datetime|date\s+and\s+time)\b/i.test(
      prompt,
    ) ||
    /\b(?:DD\/MM|MM\/DD|12[- ]?hour|24[- ]?hour|same\s+(?:as|way)|vs\s+(?:the\s+)?dashboard)\b/i.test(
      prompt,
    ) ||
    /(?:ամսաթիվ|ամսաթվ|ժամ|ձևաչափ|օր\/ամիս|ամիս\/օր|ժամացույց|համեմատ)/i.test(
      prompt,
    ) ||
    /(?:формат\s+дат|дат[аы]?|времени|дд\/мм|мм\/дд|часов)/i.test(prompt)
  );
}

function hasPreviewCue(prompt: string): boolean {
  return (
    /\b(preview|sample|what\s+would|look\s+like)\b/i.test(prompt) ||
    /\bshow\s+(?:a\s+)?(?:sample|how)\b/i.test(prompt) ||
    /(?:նախադիտ|օրինակ|ցույց\s+տուր)/i.test(prompt) ||
    /(?:предпросмотр|пример|покажи\s+как|как\s+будет)/i.test(prompt)
  );
}

export function hasResultReadyContext(prompt: string): boolean {
  return (
    /\b(?:patient\s+)?results?\s+ready\b/i.test(prompt) ||
    /\bresults?\s+(?:are\s+)?ready\b/i.test(prompt) ||
    /\bresult[- ]?ready\b/i.test(prompt) ||
    /\b(?:lab|test)\s+results?\s+(?:are\s+)?(?:ready|available)\b/i.test(
      prompt,
    ) ||
    /\blab\s+results?\s+(?:ready|available)\b/i.test(prompt) ||
    /\btest\s+results?\s+(?:ready|available)\b/i.test(prompt) ||
    /\bresults?\s+(?:are\s+)?available\b/i.test(prompt) ||
    (/(արդյունք|պատրաստ)/i.test(prompt) &&
      /(հիվանդ|patient|լաբորատոր|թեստ)/i.test(prompt)) ||
    (/(?:готовност|готов)/i.test(prompt) &&
      /(?:результат|анализ)/i.test(prompt)) ||
    (/(результат|готов|анализ)/i.test(prompt) &&
      /(пациент|patient|лаборатор)/i.test(prompt))
  );
}

const NOTIFY_RESULT_READY_VERBS =
  /\b(notify|send|tell|alert|message|contact|inform)\b/i;

export function parsePatientResultReadyParams(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> {
  const parsed: Record<string, unknown> = {};
  if (typeof params.resultId === 'string') parsed.resultId = params.resultId;
  if (typeof params.bookingId === 'string') parsed.bookingId = params.bookingId;
  if (typeof params.customerName === 'string') {
    parsed.customerName = params.customerName;
  }

  const bookingMatch = prompt.match(
    /\bbooking\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (bookingMatch) parsed.bookingId = bookingMatch[1];

  const customerMatch = prompt.match(
    /\b(?:for|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
  );
  if (customerMatch && !parsed.customerName) {
    parsed.customerName = customerMatch[1];
  }

  return parsed;
}

function isResultReadyMutatePrompt(prompt: string): boolean {
  if (!hasResultReadyContext(prompt)) return false;
  if (/\b(notify|tell|remind|alert)\s+me\b/i.test(prompt)) return false;
  if (
    /\b(book|order|place|schedule|reserve)\b/i.test(prompt) &&
    /\b(and|then|&)\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    NOTIFY_RESULT_READY_VERBS.test(prompt) ||
    /\bnotification\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return (
      /(տեղեկացնել|ուղարկել|հաղորդագր)/i.test(prompt) &&
      /(արդյունք|պատրաստ|հիվանդ|result)/i.test(prompt)
    );
  }
  if (containsCyrillicScript(prompt)) {
    return (
      /(уведомить|отправить|сообщить|напиши)/i.test(prompt) &&
      /(результат|готов|пациент|анализ)/i.test(prompt)
    );
  }
  return false;
}

export function isNotifyPatientResultReadyPrompt(prompt: string): boolean {
  return isResultReadyMutatePrompt(prompt);
}

export function parseNotificationMessageKind(
  prompt: string,
): NotificationMessageKind {
  if (/\b(gift\s*card|expiry|expires)\b/i.test(prompt)) return 'gift_card';
  if (/\b(cancel|cancellation)\b/i.test(prompt)) return 'cancellation';
  if (
    /\b(reminder|remember)\b/i.test(prompt) ||
    /հիշեցմ/i.test(prompt) ||
    /напоминан/i.test(prompt)
  ) {
    return 'reminder';
  }
  if (
    /\b(confirmation|confirm)\b/i.test(prompt) ||
    /հաստատմ/i.test(prompt) ||
    /подтвержден/i.test(prompt)
  ) {
    return 'confirmation';
  }
  return 'confirmation';
}

export function isExplainNotificationDateFormatPrompt(prompt: string): boolean {
  if (isResultReadyMutatePrompt(prompt)) return false;
  if (
    isExplainNotificationCurrencyPrompt(prompt) &&
    !hasDateTimeFormatCue(prompt)
  ) {
    return false;
  }
  if (!hasNotificationDateContext(prompt)) return false;
  if (!hasDateTimeFormatCue(prompt)) return false;
  if (isPreviewNotificationDatetimePrompt(prompt)) return false;

  if (
    /\b(how|what|why|which|do|does|same|vs|versus|compared|are)\b/i.test(
      prompt,
    ) &&
    /\b(?:dates?|time|format|dashboard|display|shown)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(explain|describe|tell me)\b/i.test(prompt) &&
    /\b(?:date|time|format)\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչպես|ինչու|ինչ|որ|որը|նույն)/i.test(prompt) &&
      /(ամսաթիվ|ժամ|ձևաչափ|նամակ|հաստատում|հիշեցում|dashboard)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(как|какой|какая|почему|объясни|тот\s+же)/i.test(prompt) &&
      /(дат[аы]?|времени|формат|письм|подтвержден|напоминан|dashboard)/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }

  return false;
}

export function isPreviewNotificationDatetimePrompt(prompt: string): boolean {
  if (isResultReadyMutatePrompt(prompt)) return false;
  if (!hasNotificationDateContext(prompt)) return false;
  if (!hasPreviewCue(prompt)) return false;

  if (
    /\b(before\s+(?:saving|changing)|vs\s+current|alternate)\b/i.test(prompt) &&
    /\b(?:date\s+format|time\s+format|us|european|iso)\b/i.test(prompt) &&
    !/\b(?:email|whatsapp|message|reminder|confirmation|gift\s*card)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(set|switch|use|configure)\b/i.test(prompt) &&
    /\b(?:date\s+format|time\s+format)\b/i.test(prompt) &&
    !/\b(?:email|whatsapp|message|reminder|confirmation|gift\s*card)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(նախադիտ|օրինակ|ցույց\s+տուր)/i.test(prompt) &&
      /(նամակ|հաստատմ|հիշեցմ|whatsapp|gift)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(предпросмотр|пример|покажи\s+как|как\s+будет)/i.test(prompt) &&
      /(письм|подтвержден|напоминан|whatsapp|gift)/i.test(prompt)
    ) {
      return true;
    }
  }

  return (
    /\b(preview|sample|what\s+would|look\s+like)\b/i.test(prompt) ||
    /\bshow\s+(?:a\s+)?(?:sample|how)\b/i.test(prompt)
  );
}

export function rescueNotificationDateFormatIntent(
  prompt: string,
  action: string,
): { action: NotificationDateFormatIntent; rescueReason: string } | null {
  if (
    (NOTIFICATION_DATE_FORMAT_INTENTS as readonly string[]).includes(action)
  ) {
    return null;
  }
  if (isNotifyPatientResultReadyPrompt(prompt)) {
    return {
      action: 'notify_patient_result_ready',
      rescueReason: 'notify_patient_result_ready',
    };
  }
  if (isPreviewNotificationDatetimePrompt(prompt)) {
    return {
      action: 'preview_notification_datetime',
      rescueReason: 'preview_notification_datetime',
    };
  }
  if (isExplainNotificationDateFormatPrompt(prompt)) {
    return {
      action: 'explain_notification_date_format',
      rescueReason: 'explain_notification_date_format',
    };
  }
  return null;
}
