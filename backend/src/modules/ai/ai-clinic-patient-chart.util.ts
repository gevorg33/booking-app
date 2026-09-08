import { ILike } from 'typeorm';
import type { Repository } from 'typeorm';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import {
  assertClinicTestOrderBusinessType,
  extractVisitCustomerNameFromPrompt,
  normalizeMultilingualCustomerName,
} from './ai-clinic-test-order.util.js';
import { extractCustomerNameFromPrompt } from './ai-retail-finance.util.js';
import { EXPLAIN_PATIENT_CHART_PROMPTS } from './ai-clinic-patient-chart.fixtures.js';
import type { PatientChartSummaryFocus } from '../patient-clinical-profiles/patient-chart-summary.util.js';

export const CLINIC_PATIENT_CHART_READ_INTENTS = [
  'explain_patient_chart',
] as const;

export const CLINIC_PATIENT_CHART_INTENTS = [
  ...CLINIC_PATIENT_CHART_READ_INTENTS,
] as const;

export type ClinicPatientChartIntent =
  (typeof CLINIC_PATIENT_CHART_INTENTS)[number];

export interface ParsedExplainPatientChartRequest {
  customerId?: string;
  customerName?: string;
  focus: PatientChartSummaryFocus[];
}

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const EXPLAIN_CHART_VERB = new RegExp(
  String.raw`\b(explain|show|summarize|summary|review|tell\s+me\s+about|list|what|can\s+you|open|pull\s+up)\b|(?:\p{L}*բացատր${UNICODE_WORD_SUFFIX}|բացատր${UNICODE_WORD_SUFFIX}|\p{L}*ցույց${UNICODE_WORD_SUFFIX}|ցույց${UNICODE_WORD_SUFFIX}|\p{L}*ամփոփ${UNICODE_WORD_SUFFIX}|ամփոփ${UNICODE_WORD_SUFFIX}|\p{L}*պատմ${UNICODE_WORD_SUFFIX}|պատմ${UNICODE_WORD_SUFFIX}|\p{L}*ներկայացր${UNICODE_WORD_SUFFIX}|\p{L}*վերանայ${UNICODE_WORD_SUFFIX}|\p{L}*ցուցակավոր${UNICODE_WORD_SUFFIX}|ինչ${UNICODE_WORD_SUFFIX}|կարող\s+ես)|(?:[Оо]бъясн${UNICODE_WORD_SUFFIX}|[Пп]окаж${UNICODE_WORD_SUFFIX}|[Рр]езюмир${UNICODE_WORD_SUFFIX}|[Рр]асскаж${UNICODE_WORD_SUFFIX}|[Оо]пиш${UNICODE_WORD_SUFFIX}|[Пп]росмотр${UNICODE_WORD_SUFFIX}|[Пп]еречисл${UNICODE_WORD_SUFFIX}|[Кк]акие${UNICODE_WORD_SUFFIX}|[Чч]то${UNICODE_WORD_SUFFIX}|[Мм]ожешь${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const CHART_CONTEXT = new RegExp(
  String.raw`\b(patient\s+chart|chart\s+summary|(?:['’]s)\s+chart\b|clinical\s+profile|on\s+(?:her|his|their)\s+chart|from\s+(?:her|his|their)\s+chart)\b|(?:հիվանդի\s+քարտ|հիվանդային\s+քարտ|քարտ(?:ի)?\s+ամփոփում|իր\s+քարտում|նրա\s+քարտ(?:ում|ից)?)|(?:карт${UNICODE_WORD_SUFFIX}\s+пациента|сводк${UNICODE_WORD_SUFFIX}\s+карт${UNICODE_WORD_SUFFIX}|карт${UNICODE_WORD_SUFFIX}\s+пациента|медкарта|медицинск${UNICODE_WORD_SUFFIX}\s+карт${UNICODE_WORD_SUFFIX}|из\s+(?:ее|её|его)\s+карт${UNICODE_WORD_SUFFIX}|карт${UNICODE_WORD_SUFFIX}\s+мари${UNICODE_WORD_SUFFIX}|карт${UNICODE_WORD_SUFFIX}\s+марии)`,
  'iu',
);

const NON_PATIENT_CHART_TOPIC_BLOCK = new RegExp(
  String.raw`\b(vat|gst|tax|checkout|booking\s+page|service\s+cards?|incl\.|promo\s+code|loyalty|currency|stripe|налог|հարկ|карточк${UNICODE_WORD_SUFFIX}\s+услуг|услуг${UNICODE_WORD_SUFFIX}\s+на\s+страниц)`,
  'iu',
);
const CHART_FOCUS_PAIR = new RegExp(
  String.raw`\ballergies?\b.*\b(?:visits?|appointments?)|(?:visits?|appointments?)\b.*\ballergies?|pending\s+(?:lab\s+)?results?|ալերգիա\w*[\s\S]{0,40}այց\w*|այց\w*[\s\S]{0,40}ալերգիա\w*|սպասող[\s\S]{0,40}արդյունք\w*|аллерги\w*[\s\S]{0,40}визит\w*|визит\w*[\s\S]{0,40}аллерги\w*|ожида\w*[\s\S]{0,40}результат\w*`,
  'iu',
);
const CHART_TOPIC_NOUN = new RegExp(
  String.raw`ալերգիա|այց|արդյունք|լաբորատոր|аллерги|визит|результат|анализ`,
  'iu',
);

export function isExplainPatientChartPrompt(prompt: string): boolean {
  if (NON_PATIENT_CHART_TOPIC_BLOCK.test(prompt)) return false;
  const hasExplainVerb = EXPLAIN_CHART_VERB.test(prompt);

  if (hasExplainVerb && CHART_CONTEXT.test(prompt)) {
    return true;
  }

  if (hasExplainVerb && CHART_FOCUS_PAIR.test(prompt)) {
    return true;
  }

  if (/\bpatient\s+chart\b/i.test(prompt) && /\b(for|about)\b/i.test(prompt)) {
    return true;
  }

  if (/\bchart\s+(?:for|about)\b/i.test(prompt)) {
    return true;
  }

  if (
    /(?:հիվանդի\s+քարտ|карт\w*\s+пациента)/iu.test(prompt) &&
    /(?:համար|для)/iu.test(prompt)
  ) {
    return true;
  }

  if (/\blist\b/i.test(prompt) && /\bpatient\s+chart\b/i.test(prompt)) {
    return true;
  }

  if (/(?:ցուցակավոր|перечисл)/iu.test(prompt) && CHART_CONTEXT.test(prompt)) {
    return true;
  }

  if (
    /\bwhat\b.*\bpending\s+(?:lab\s+)?results?\b/i.test(prompt) &&
    /\bchart\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /(?:ինչ|какие)\w*/iu.test(prompt) &&
    /(?:սպասող|ожида)\w*/iu.test(prompt) &&
    /(?:արդյունք|результат|քարտ|карт)/iu.test(prompt)
  ) {
    return true;
  }

  if (
    /\btell\s+me\s+about\b/i.test(prompt) &&
    /\ballergies?\b/i.test(prompt) &&
    /\b(?:recent\s+)?visits?\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /(?:պատմիր|расскаж)/iu.test(prompt) &&
    /(?:ալերգիա|аллерги)/iu.test(prompt) &&
    /(?:այց|визит)/iu.test(prompt)
  ) {
    return true;
  }

  if (
    CHART_CONTEXT.test(prompt) &&
    /(?:—|–|-|՝)/u.test(prompt) &&
    CHART_TOPIC_NOUN.test(prompt)
  ) {
    return true;
  }

  if (CHART_CONTEXT.test(prompt) && CHART_TOPIC_NOUN.test(prompt)) {
    return true;
  }

  return false;
}

export function extractPatientChartFocusFromPrompt(
  prompt: string,
): PatientChartSummaryFocus[] {
  const focus: PatientChartSummaryFocus[] = [];
  if (/\ballergies?\b|ալերգիա|аллерги/i.test(prompt)) focus.push('allergies');
  if (
    /\b(?:recent\s+)?visits?\b|\bappointments?\b|այց|վերջին\s+այց|визит|последн/i.test(
      prompt,
    )
  ) {
    focus.push('visits');
  }
  if (
    /\bpending\s+(?:lab\s+)?results?\b|\bopen\s+labs?\b|սպասող[\s\S]{0,24}արդյունք|ожида\w*[\s\S]{0,24}результат/i.test(
      prompt,
    )
  ) {
    focus.push('results');
  }
  const openLabAnalyzes = new RegExp(
    String.raw`открыт${UNICODE_WORD_SUFFIX}[\s\S]{0,12}анализ${UNICODE_WORD_SUFFIX}`,
    'iu',
  );
  if (
    /\bopen\s+labs?\b|\bopen\s+lab\s+orders?\b|\blab\s+orders?\b|բաց\s+լաբորատոր/i.test(
      prompt,
    ) ||
    openLabAnalyzes.test(prompt)
  ) {
    focus.push('orders');
  }
  if (
    /\bopen\s+labs?\b/i.test(prompt) ||
    openLabAnalyzes.test(prompt) ||
    /բաց\s+լաբորատոր/i.test(prompt)
  ) {
    focus.push('results');
  }
  return focus.length > 0 ? focus : ['all'];
}

export function parseExplainPatientChartFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainPatientChartRequest | null {
  if (!isExplainPatientChartPrompt(prompt)) return null;

  const customerId =
    (typeof params.customerId === 'string' && params.customerId.trim()
      ? params.customerId.trim()
      : undefined) ?? undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractVisitCustomerNameFromPrompt(prompt) ??
    extractPatientChartCustomerNameFromPrompt(prompt) ??
    extractCustomerNameFromPrompt(prompt) ??
    undefined;

  const focusFromParams = Array.isArray(params.focus)
    ? params.focus.filter(
        (value): value is PatientChartSummaryFocus =>
          typeof value === 'string' &&
          ['all', 'allergies', 'visits', 'results', 'orders'].includes(value),
      )
    : typeof params.focus === 'string' && params.focus.trim()
      ? [params.focus.trim() as PatientChartSummaryFocus]
      : [];

  const focus =
    focusFromParams.length > 0
      ? focusFromParams
      : extractPatientChartFocusFromPrompt(prompt);

  if (!customerId && !customerName) return null;

  return {
    customerId,
    customerName,
    focus,
  };
}

export function extractPatientChartCustomerNameFromPrompt(
  prompt: string,
): string | null {
  const tellMeAbout = prompt.match(
    /\btell\s+me\s+about\s+([A-Za-z][\w-]*?)(?:['’]s)\b/i,
  );
  if (tellMeAbout?.[1]) return tellMeAbout[1].trim();

  const possessiveChart = prompt.match(
    /\b([A-Za-z][\w-]*?)(?:['’]s)\s+(?:patient\s+)?chart(?:\s+summary)?\b/i,
  );
  if (possessiveChart?.[1]) return possessiveChart[1].trim();

  const listFromChart = prompt.match(/\blist\s+([A-Za-z][\w-]*?)(?:['’]s)\b/i);
  if (listFromChart?.[1] && /\bpatient\s+chart\b/i.test(prompt)) {
    return listFromChart[1].trim();
  }

  const chartFor = prompt.match(
    /\bpatient\s+chart\s+(?:for|about)\s+([A-Za-z][\w-]*)\b/i,
  );
  if (chartFor?.[1]) return chartFor[1].trim();

  const summarizeFor = prompt.match(
    /\b(?:summarize|explain)\s+patient\s+chart\s+for\s+([A-Za-z][\w-]*)\b/i,
  );
  if (summarizeFor?.[1]) return summarizeFor[1].trim();

  const forPatient = prompt.match(
    /\b(?:for|about)\s+([A-Za-z][\w-]*)(?:['’]s)?\s+patient\s+chart\b/i,
  );
  if (forPatient?.[1]) return forPatient[1].trim();

  const doesHaveOnChart = prompt.match(/\bdoes\s+([A-Za-z][\w-]*)\s+have\b/i);
  if (doesHaveOnChart?.[1] && /\bchart\b/i.test(prompt)) {
    return doesHaveOnChart[1].trim();
  }

  const ruVisitsFromChart = prompt.match(
    new RegExp(String.raw`визит${UNICODE_WORD_SUFFIX}\s+([\p{L}]+)\s+из`, 'iu'),
  );
  if (ruVisitsFromChart?.[1]) {
    return normalizeMultilingualCustomerName(ruVisitsFromChart[1]);
  }

  const ruWhoseChart = prompt.match(/у\s+([\p{L}]+)\s+в\s+карт/iu);
  if (ruWhoseChart?.[1]) {
    return normalizeMultilingualCustomerName(ruWhoseChart[1]);
  }

  const ruPatientChart = prompt.match(
    new RegExp(
      String.raw`(?:в\s+)?карт${UNICODE_WORD_SUFFIX}\s+пациента\s+([\p{L}]+)`,
      'iu',
    ),
  );
  if (ruPatientChart?.[1]) {
    return normalizeMultilingualCustomerName(ruPatientChart[1]);
  }

  const ruChartPatient = prompt.match(
    new RegExp(String.raw`карт${UNICODE_WORD_SUFFIX}\s+([\p{L}]+)`, 'iu'),
  );
  if (
    ruChartPatient?.[1] &&
    !/^(?:пациента|patient)$/iu.test(ruChartPatient[1])
  ) {
    return normalizeMultilingualCustomerName(ruChartPatient[1]);
  }

  const ruChartSummary = prompt.match(
    new RegExp(
      String.raw`(?:сводк${UNICODE_WORD_SUFFIX}\s+)?карт${UNICODE_WORD_SUFFIX}\s+([\p{L}]+)\s*$`,
      'iu',
    ),
  );
  if (
    ruChartSummary?.[1] &&
    !/^(?:пациента|patient)$/iu.test(ruChartSummary[1])
  ) {
    return normalizeMultilingualCustomerName(ruChartSummary[1]);
  }

  const ruForPatient = prompt.match(/для\s+([\p{L}]+)\s*$/iu);
  if (ruForPatient?.[1]) {
    return normalizeMultilingualCustomerName(ruForPatient[1]);
  }

  const ruAboutPatient = prompt.match(
    /(?:об|о)\s+[\s\S]{0,40}?\s+([\p{L}]+)\s*$/iu,
  );
  if (ruAboutPatient?.[1] && /(?:аллерги|визит)/iu.test(prompt)) {
    return normalizeMultilingualCustomerName(ruAboutPatient[1]);
  }

  const hyHasOnChart = prompt.match(/ունի\s+([\p{L}]+)ն?\s+իր\s+քարտում/iu);
  if (hyHasOnChart?.[1]) {
    return normalizeMultilingualCustomerName(hyHasOnChart[1]);
  }

  return null;
}

export function rescueClinicPatientChartIntent(
  prompt: string,
  action: string,
): { action: ClinicPatientChartIntent; rescueReason: string } | null {
  if ((CLINIC_PATIENT_CHART_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (parseExplainPatientChartFromPrompt(prompt)) {
    return {
      action: 'explain_patient_chart',
      rescueReason: 'explain_patient_chart',
    };
  }

  return null;
}

export interface PatientChartCustomerResolveDeps {
  customerRepo: Pick<Repository<Customer>, 'find' | 'findOne'>;
}

export async function resolveCustomerForPatientChart(
  deps: PatientChartCustomerResolveDeps,
  businessId: string,
  parsed: ParsedExplainPatientChartRequest,
): Promise<Customer | null> {
  if (parsed.customerId) {
    const byId = await deps.customerRepo.findOne({
      where: { id: parsed.customerId, businessId, isActive: true },
    });
    if (byId) return byId;

    // e2e-bug.443 shape / §223 — this used to load an arbitrary 200 customers
    // and prefix-match in memory. `take` with no `order` is a storage-ordered
    // slice, so past 200 customers a real id prefix simply was not in the set
    // and silently failed to resolve, and *which* 200 you got could differ
    // between identical calls. Matching the prefix in SQL makes the cap bound
    // matching rows instead of arbitrary ones, and the order deterministic.
    const idPrefix = (parsed.customerId ?? '').replace(
      /[\\%_]/g,
      (ch) => `\\${ch}`,
    );
    const customers = await deps.customerRepo.find({
      where: { businessId, isActive: true, id: ILike(`${idPrefix}%`) },
      order: { id: 'ASC' },
      take: 200,
    });
    return customers[0] ?? null;
  }

  if (parsed.customerName) {
    // e2e-bug.443 shape / §223 — same fault as the id branch above, and the
    // same one `resolvePatientForClinicalMutation` was fixed for: an arbitrary
    // 200 rows filtered in memory. Filtering by name in SQL means the cap
    // bounds *matching* patients. Exact beats substring, which the in-memory
    // version did not do — it returned `matches[0]`, so "Ann" could win over
    // an exact "Anna" purely on storage order.
    const needle = parsed.customerName.toLowerCase();
    const escaped = needle.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const customers = await deps.customerRepo.find({
      where: {
        businessId,
        isActive: true,
        name: ILike(`%${escaped}%`),
      },
      order: { name: 'ASC', id: 'ASC' },
      take: 200,
    });
    return (
      customers.find((customer) => customer.name.toLowerCase() === needle) ??
      customers[0] ??
      null
    );
  }

  return null;
}

export { assertClinicTestOrderBusinessType as assertClinicPatientChartBusinessType };

export function resolvePatientChartSummaryFocus(
  focus: PatientChartSummaryFocus[],
): PatientChartSummaryFocus {
  if (focus.length === 1) return focus[0];
  return 'all';
}

export function buildClinicPatientChartFixtureExpectations() {
  return {
    explain: EXPLAIN_PATIENT_CHART_PROMPTS,
  };
}
