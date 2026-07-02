import type { PatientReleasedDocumentCustomerView } from '../../common/utils/patient-customer-document-access.util.js';
import {
  isPatientDocumentCategory,
  type PatientDocumentCategory,
} from '../../common/utils/patient-document-category.util.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import {
  isExplainResultStatusPrompt,
  isListMyTestResultsPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import { isTrackLabOrderStatusPrompt } from './ai-track-lab-order-status.util.js';
import {
  LIST_MY_DOCUMENTS_PROMPTS,
  type ListMyDocumentsPromptFixture,
} from './ai-list-my-documents.fixtures.js';
import { LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS } from './ai-list-my-documents-multilingual.fixtures.js';

export const LIST_MY_DOCUMENTS_INTENTS = ['list_my_documents'] as const;

export type ListMyDocumentsIntent = (typeof LIST_MY_DOCUMENTS_INTENTS)[number];

export {
  CUSTOMER_LIST_MY_DOCUMENTS_CLASSIFIER_RULES,
  LIST_MY_DOCUMENTS_PROMPTS,
  LIST_MY_DOCUMENTS_RESCUE_SCENARIOS,
} from './ai-list-my-documents.fixtures.js';

export interface ParsedListMyDocumentsRequest {
  category?: PatientDocumentCategory;
  title?: string;
}

const STAFF_DOCUMENT_NOTIFY_BLOCK = new RegExp(
  String.raw`\b(?:upload|attach|send|email)\b.{0,30}\b(?:document|referral|imaging)\b.{0,30}\b(?:patient|customer)\b`,
  'iu',
);

const DOCUMENT_NOUN = new RegExp(
  String.raw`\b(?:referral\s+letter|imaging\s+reports?|radiology\s+reports?|ultrasound\s+report|x-?ray\s+reports?|clinic\s+documents?|patient\s+documents?|released\s+documents?|my\s+documents?|document\s+files?|pdfs?)\b|(?:փաստաթղթ|ուղեգիր|պատկերագր|ուլտրա)|(?:направлен|документ|снимк|рентген|отчёт)`,
  'iu',
);

const LAB_RESULT_ONLY = new RegExp(
  String.raw`\b(?:test|lab)\s+results?\b|\bmy\s+results\b|(?:թեստ|լաբ).{0,12}արդյունք|լաբ\s+արդյունք|результат|анализ`,
  'iu',
);

const LAB_REPORT_DOCUMENT_CUE = new RegExp(
  String.raw`\b(?:lab\s+report|report)\b.{0,20}\b(?:pdf|document|file)\b|\b(?:pdf|document|file)\b.{0,20}\blab\s+report\b`,
  'iu',
);

const MY_SCOPE = new RegExp(
  String.raw`\b(?:my|account|released)\b|իմ|հաշիվ|мо[иейюяё]|аккаунт`,
  'iu',
);

const LIST_VERBS = new RegExp(
  String.raw`\b(?:show|list|open|view|see|where|what)\b|ցույց|բացիր|տեսն|որտեղ|покаж|открой|список|где`,
  'iu',
);

const CATEGORY_LABELS: Record<PatientDocumentCategory, string> = {
  referral_letter: 'referral letter',
  imaging_report: 'imaging report',
  lab_report: 'lab report',
  other: 'document',
};

function matchListMyDocumentsScenario(
  prompt: string,
): ListMyDocumentsPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of LIST_MY_DOCUMENTS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isListMyDocumentsIntent(
  action: string,
): action is ListMyDocumentsIntent {
  return (LIST_MY_DOCUMENTS_INTENTS as readonly string[]).includes(action);
}

export function extractDocumentCategoryFromPrompt(
  prompt: string,
): PatientDocumentCategory | undefined {
  if (/\b(?:referral\s+letter|referral)\b|ուղեգիր|направлен/i.test(prompt)) {
    return 'referral_letter';
  }
  if (
    /\b(?:imaging|radiology|x-?ray|mri|ct\s+scan|ultrasound|sonogram)\b|պատկերագր|ուլտրա|սոնոգրաֆ|рентген|МРТ|КТ|узи|снимк/i.test(
      prompt,
    )
  ) {
    return 'imaging_report';
  }
  if (LAB_REPORT_DOCUMENT_CUE.test(prompt)) {
    return 'lab_report';
  }
  return undefined;
}

export function extractDocumentTitleFromPrompt(
  prompt: string,
): string | undefined {
  const quoted = prompt.match(/["'«]([^"'»]+)["'»]/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();
  return undefined;
}

export function isListMyDocumentsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;

  const scenario = matchListMyDocumentsScenario(text);
  if (scenario) return true;

  if (STAFF_DOCUMENT_NOTIFY_BLOCK.test(text)) return false;
  if (isListMyTestResultsPrompt(text) && !DOCUMENT_NOUN.test(text)) {
    return false;
  }
  if (isTrackLabOrderStatusPrompt(text)) return false;
  if (isExplainResultStatusPrompt(text)) return false;

  if (LAB_REPORT_DOCUMENT_CUE.test(text)) return true;
  if (DOCUMENT_NOUN.test(text)) {
    if (LAB_RESULT_ONLY.test(text) && !DOCUMENT_NOUN.test(text)) {
      return false;
    }
    if (LIST_VERBS.test(text) || MY_SCOPE.test(text)) {
      return true;
    }
    if (/\b(?:do\s+i\s+have|are\s+there)\b/i.test(text)) {
      return true;
    }
  }

  if (
    /\b(?:documents?|pdfs?)\b/i.test(text) &&
    /\b(?:my\s+results|account)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}

export function parseListMyDocumentsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListMyDocumentsRequest | null {
  if (!isListMyDocumentsPrompt(prompt)) return null;

  const scenario = matchListMyDocumentsScenario(prompt);
  const categoryFromParams =
    typeof params.category === 'string' &&
    isPatientDocumentCategory(params.category)
      ? params.category
      : undefined;
  const titleFromParams =
    typeof params.title === 'string' && params.title.trim()
      ? params.title.trim()
      : undefined;

  const category =
    categoryFromParams ??
    scenario?.category ??
    extractDocumentCategoryFromPrompt(prompt);
  const title =
    titleFromParams ??
    scenario?.title ??
    extractDocumentTitleFromPrompt(prompt);

  return {
    ...(category ? { category } : {}),
    ...(title ? { title } : {}),
  };
}

export function rescueListMyDocumentsIntent(
  prompt: string,
  action: string,
): { action: ListMyDocumentsIntent; rescueReason: string } | null {
  if (isListMyDocumentsIntent(action)) return null;
  if (!parseListMyDocumentsFromPrompt(prompt)) return null;
  return { action: 'list_my_documents', rescueReason: 'list_my_documents' };
}

export function enrichListMyDocumentsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseListMyDocumentsFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.category ? { category: parsed.category } : {}),
    ...(parsed.title ? { title: parsed.title } : {}),
  };
}

export function buildListMyDocumentsNavigate(
  category?: PatientDocumentCategory,
): { path: string; query: Record<string, string> } {
  return {
    path: '/results',
    query: {
      section: 'my-documents',
      ...(category ? { category } : {}),
    },
  };
}

function formatDocumentLine(
  document: PatientReleasedDocumentCustomerView,
): string {
  const label =
    document.title ??
    document.originalFileName ??
    CATEGORY_LABELS[document.category];
  return `${CATEGORY_LABELS[document.category]}: ${label}`;
}

export function formatReleasedDocumentsSummary(
  documents: PatientReleasedDocumentCustomerView[],
  options: {
    category?: PatientDocumentCategory;
    title?: string;
    locale?: AppLocale;
  } = {},
): string {
  let filtered = documents;
  if (options.category) {
    filtered = filtered.filter(
      (document) => document.category === options.category,
    );
  }
  if (options.title) {
    const needle = options.title.toLowerCase();
    filtered = filtered.filter(
      (document) =>
        document.title?.toLowerCase().includes(needle) ||
        document.originalFileName?.toLowerCase().includes(needle),
    );
  }

  if (filtered.length === 0) {
    if (options.category) {
      return `No released ${CATEGORY_LABELS[options.category]} documents in your account yet. Open My Results to check again.`;
    }
    return 'No released documents in your account yet. Open My Results to see clinic PDFs when they are shared with you.';
  }

  if (filtered.length === 1) {
    return `You have 1 released document: ${formatDocumentLine(filtered[0])}. Open My Results → My documents to view or download it.`;
  }

  const preview = filtered
    .slice(0, 3)
    .map((document) => formatDocumentLine(document))
    .join('; ');
  const suffix = filtered.length > 3 ? ` (+${filtered.length - 3} more)` : '';
  return `You have ${filtered.length} released documents: ${preview}${suffix}. Open My Results → My documents to browse them.`;
}

export function buildListMyDocumentsFixtureExpectations() {
  return LIST_MY_DOCUMENTS_PROMPTS.map((scenario) => ({
    id: scenario.id,
    prompt: scenario.prompt,
    expectedAction: scenario.expectedAction,
    category: scenario.category ?? null,
    title: scenario.title ?? null,
  }));
}
