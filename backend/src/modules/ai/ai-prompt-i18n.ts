/**
 * Normalizes Armenian / Russian (and common transliterations) into English
 * keywords understood by prompt resolvers. Applied before LLM classification.
 */

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  // ── Armenian ──
  [/ամսագրումներ/gi, 'appointments'],
  [/ամրագրումներ/gi, 'appointments'],
  [/ամսագրում/gi, 'appointment'],
  [/ամրագրում/gi, 'appointment'],
  [/այսօր/gi, 'today'],
  [/այսօրվա/gi, 'today'],
  [/վաղը/gi, 'tomorrow'],
  [/երեկ/gi, 'yesterday'],
  [/այս\s*շաբաթ/gi, 'this week'],
  [/հաջորդ\s*շաբաթ/gi, 'next week'],
  [/անցած\s*շաբաթ/gi, 'last week'],
  [/այս\s*ամիս/gi, 'this month'],
  [/հաճախորդներ/gi, 'customers'],
  [/հաճախորդ/gi, 'customer'],
  [/ծառայություններ/gi, 'services'],
  [/ծառայություն/gi, 'service'],
  [/չեղարկ/gi, 'cancel'],
  [/չեղարկել/gi, 'cancel'],
  [/ազատ\s*(ժամ|slot|slots)/gi, 'available slots'],
  [/ոգտագործում/gi, 'utilization'],
  [/վերսորդ/gi, 'waitlist'],
  [/սպասման\s*ցուցակ/gi, 'waitlist'],
  [/վճար/gi, 'paid'],
  [/դրամ/gi, 'revenue'],
  [/ամենաթանկ/gi, 'most expensive'],
  [/ամենաերկար/gi, 'longest'],
  [/զբաղված/gi, 'busiest'],
  [/ով\s*ի/gi, 'who is'],
  [/որքան/gi, 'how many'],
  [/ցույց\s*տուր/gi, 'show'],
  [/ցուցադր/gi, 'show'],
  [/լրացրու/gi, 'fill'],
  [/բաց\s*(slot|slots|ժամ)/gi, 'open slots'],
  [/կատարող/gi, 'provider'],
  [/մասնագետ/gi, 'provider'],
  [/կարգավոր/gi, 'schedule'],
  [/գրաֆիկ/gi, 'schedule'],
  [/փոխել/gi, 'change'],
  [/ծառայության\s*տեսակ/gi, 'service type'],

  // ── Russian ──
  [/записи/gi, 'appointments'],
  [/запись/gi, 'appointment'],
  [/записей/gi, 'appointments'],
  [/сегодня/gi, 'today'],
  [/завтра/gi, 'tomorrow'],
  [/вчера/gi, 'yesterday'],
  [/на\s*этой\s*неделе/gi, 'this week'],
  [/на\s*следующей\s*неделе/gi, 'next week'],
  [/на\s*прошлой\s*неделе/gi, 'last week'],
  [/в\s*этом\s*месяце/gi, 'this month'],
  [/в\s*прошлом\s*месяце/gi, 'last month'],
  [/клиенты/gi, 'customers'],
  [/клиент/gi, 'customer'],
  [/клиентов/gi, 'customers'],
  [/услуги/gi, 'services'],
  [/услуга/gi, 'service'],
  [/отмен/gi, 'cancel'],
  [/отменить/gi, 'cancel'],
  [/отмена/gi, 'cancelled'],
  [/свободн/gi, 'available'],
  [/загрузк/gi, 'utilization'],
  [/лист\s*ожидания/gi, 'waitlist'],
  [/ожидания/gi, 'waitlist'],
  [/оплат/gi, 'paid'],
  [/выручк/gi, 'revenue'],
  [/доход/gi, 'revenue'],
  [/самый\s*дорог/gi, 'most expensive'],
  [/самый\s*длинн/gi, 'longest'],
  [/самый\s*занят/gi, 'busiest'],
  [/сколько/gi, 'how many'],
  [/покажи/gi, 'show'],
  [/показать/gi, 'show'],
  [/заполни/gi, 'fill'],
  [/сотрудник/gi, 'provider'],
  [/мастер/gi, 'provider'],
  [/специалист/gi, 'provider'],
  [/расписание/gi, 'schedule'],
  [/график/gi, 'schedule'],
  [/кто\s*(может|делает|оказывает)/gi, 'who can do'],
  [/какие\s*услуги/gi, 'what services'],
  [/сменить/gi, 'change'],
  [/изменить/gi, 'change'],
  [/тип\s*услуги/gi, 'service type'],

  // ── Common transliteration (hy/ru typed in Latin) ──
  [/\baysor\b/gi, 'today'],
  [/\bvagh@?\b/gi, 'tomorrow'],
  [/\berk@?\b/gi, 'yesterday'],
  [/\bchaxord\b/gi, 'customer'],
  [/\btsarayutyun\b/gi, 'service'],
  [/\bamsagrum\b/gi, 'appointment'],
  [/\bchegharke?l\b/gi, 'cancel'],
  [/\bazat\b/gi, 'available'],
  [/\bogtagortum\b/gi, 'utilization'],
  [/\bsevodnya\b/gi, 'today'],
  [/\bzavtra\b/gi, 'tomorrow'],
  [/\bvchera\b/gi, 'yesterday'],
  [/\bkklient\b/gi, 'customer'],
  [/\busluga\b/gi, 'service'],
  [/\bzapis\b/gi, 'appointment'],
  [/\botmen/i, 'cancel'],
  [/\bskolko\b/gi, 'how many'],
  [/\bpokazhi\b/gi, 'show'],
];

export function containsNonEnglishScript(text: string): boolean {
  return /[\u0530-\u058F\u0400-\u04FF]/.test(text);
}

export function normalizeMultilingualPrompt(prompt: string): string {
  let normalized = prompt.trim();
  if (!normalized) return normalized;

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

/** If prompt was translated, expose hint for LLM classifier. */
export function multilingualHint(original: string, normalized: string): string | null {
  if (original === normalized || !containsNonEnglishScript(original)) return null;
  return `User prompt may be Armenian/Russian; normalized intent text: "${normalized}"`;
}
