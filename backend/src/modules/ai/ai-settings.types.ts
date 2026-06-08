export interface AutopilotRule {
  id: string;
  name: string;
  enabled: boolean;
  /** cron expression (UTC) e.g. "0 6 * * 0" = Sunday 06:00 */
  cron?: string;
  /** NL command executed when rule fires */
  prompt: string;
  lastRunAt?: string | null;
}

export interface BusinessPlaybook {
  id: string;
  name: string;
  description: string;
  /** Phrases that trigger this playbook (case-insensitive substring match) */
  triggers: string[];
  /** Command sent to AI orchestration */
  prompt: string;
  enabled: boolean;
}

/** Saved dashboard command shortcuts (ai-d5). */
export interface AiCommandMacro {
  id: string;
  name: string;
  prompt: string;
}

export interface AiConfidenceThresholds {
  /** Below this → ask user to confirm intent */
  low: number;
  /** At or above this → may auto-execute low-risk plans */
  high: number;
}

/** ai-e3 — finer role profile beyond JWT membership role. */
export type AiRoleProfile = 'owner' | 'manager' | 'receptionist' | 'provider';

export interface AiSuggestionVariant {
  id: string;
  title: string;
  prompt: string;
}

export interface AiClassificationVariant {
  id: string;
  label: string;
}

/** ai-e5 — A/B experiment for suggestion copy and auto-execute thresholds. */
export interface AiAbExperiment {
  id: string;
  name: string;
  enabled: boolean;
  suggestionVariants?: AiSuggestionVariant[];
  /** acc-3.10 — classifier appendix variants (control vs fewshot_heavy). */
  classificationVariants?: AiClassificationVariant[];
  /** acc-3.10 — harness winner promoted after eval scoring. */
  promotedClassificationVariantId?: string | null;
  confidenceHigh?: number;
}

/** ai-e1/e3/e5/e7 — enterprise AI configuration. */
export interface AiEnterpriseSettings {
  defaultLocationId?: string | null;
  /** Maps membership role → AI role profile (e.g. staff → receptionist). */
  roleProfiles?: Partial<Record<string, AiRoleProfile>>;
  /** acc-3.10 — promoted classifier appendix variant after A/B harness. */
  classificationAppendixVariantId?: string | null;
  abExperiments?: AiAbExperiment[];
  /** Minutes before pending tasks escalate to owner (ai-e7). */
  hitlSlaMinutes?: number;
  /** Override vertical plugin (ai-e4); null = infer from businessType. */
  verticalPlugin?: 'salon' | 'clinic' | 'fitness' | null;
}

export interface EntityMemoryEntry {
  employeeName?: string | null;
  serviceName?: string | null;
  customerName?: string | null;
  templateName?: string | null;
}

/** acc-3.13 — per-business prompt→action shorthand learned from corrections and recurring use. */
export interface BusinessParaphraseEntry {
  id: string;
  phrase: string;
  normalizedPhrase: string;
  action: string;
  surface: 'dashboard' | 'provider' | 'customer' | 'public';
  locale?: string;
  source: 'correction' | 'recurring';
  hitCount: number;
  learnedAt: string;
}

export interface PendingAliasSuggestion {
  id: string;
  alias: string;
  entry: EntityMemoryEntry;
  correctionCount: number;
  lastSeenAt: string;
  source: 'entity_disambiguation' | 'correction';
}

export interface EntityMemory {
  aliases: Record<string, EntityMemoryEntry>;
  paraphrases?: BusinessParaphraseEntry[];
  /** acc-6.3 — admin one-click approve into aliases. */
  pendingAliasSuggestions?: PendingAliasSuggestion[];
}

export type RagDocumentType =
  | 'sop'
  | 'playbook_note'
  | 'business_note'
  | 'past_plan';

/** Optional RAG knowledge chunk stored per business (ai-i8). */
export interface RagDocument {
  id: string;
  title: string;
  content: string;
  type: RagDocumentType;
  enabled: boolean;
  keywords?: string[];
}

export interface AiRagSettings {
  enabled: boolean;
  documents: RagDocument[];
}

/** acc-6.2 / acc-3.8 — business-specific rescue learned from triaged failures. */
export interface LearnedTelemetryRescueRule {
  id: string;
  fromAction: string;
  toAction: string;
  rescueReason: string;
  promptSnippet: string;
  promptHash: string;
  surfaces?: Array<'dashboard' | 'provider' | 'customer' | 'public'>;
  sourceEvalCaseId?: string;
  learnedAt: string;
}

/** acc-6.2 — clarify prompt fix learned from triaged clarify failures. */
export interface ClarifyPromptFix {
  id: string;
  promptHash: string;
  promptSnippet: string;
  clarifyAction: string;
  clarifyFields: string[];
  sourceEvalCaseId?: string;
  learnedAt: string;
}

export interface AiAccuracyProgramSettings {
  lastWeeklyReview?: Record<string, unknown>;
  lastWeeklyReviewPublishedAt?: string;
  /** acc-6.2 — learned telemetry rescue rules from labeling pipeline. */
  learnedRescueRules?: LearnedTelemetryRescueRule[];
  /** acc-6.2 — clarify field expectations from labeling pipeline. */
  clarifyPromptFixes?: ClarifyPromptFix[];
}

export interface AiSettings {
  autopilot: {
    enabled: boolean;
    rules: AutopilotRule[];
  };
  playbooks: BusinessPlaybook[];
  /** User-saved command templates for the command bar */
  macros: AiCommandMacro[];
  confidence: AiConfidenceThresholds;
  entityMemory?: EntityMemory;
  rag?: AiRagSettings;
  enterprise?: AiEnterpriseSettings;
  /** acc-6.1 — last published weekly accuracy review snapshot. */
  accuracyProgram?: AiAccuracyProgramSettings;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  autopilot: {
    enabled: false,
    rules: [
      {
        id: 'auto-fill-gaps',
        name: 'Auto-fill small gaps',
        enabled: false,
        cron: '0 7 * * 1-5',
        prompt:
          'Fill schedule gaps under 30 minutes for all providers today between 9-19',
      },
      {
        id: 'sunday-template',
        name: 'Sunday weekday template',
        enabled: false,
        cron: '0 6 * * 0',
        prompt: 'Apply weekday template to all providers next week',
      },
    ],
  },
  macros: [
    {
      id: 'monday-morning-setup',
      name: 'Monday morning setup',
      prompt:
        'Apply weekday template to all providers this week, then fill gaps between 9-19',
    },
    {
      id: 'end-week-gap-fill',
      name: 'End-of-week gap fill',
      prompt:
        'Fill schedule gaps between 9-19 for all providers for the rest of this week',
    },
  ],
  playbooks: [
    {
      id: 'salon-weekday',
      name: 'Salon weekday',
      description: 'Apply weekday template and fill 9–19 gaps for the team',
      triggers: ['salon weekday', 'weekday setup', 'standard weekday'],
      prompt:
        'Apply weekday template to all providers this week, then fill gaps between 9-19',
      enabled: true,
    },
    {
      id: 'holiday-closure',
      name: 'Holiday closure',
      description: 'Block all providers for a holiday',
      triggers: ['holiday closure', 'close for holiday', 'holiday mode'],
      prompt: 'Block entire day for all providers tomorrow — holiday closure',
      enabled: true,
    },
  ],
  confidence: { low: 0.55, high: 0.85 },
  entityMemory: { aliases: {} },
  rag: { enabled: false, documents: [] },
  enterprise: {
    roleProfiles: { staff: 'receptionist', contributor: 'provider' },
    abExperiments: [
      {
        id: 'suggestion-copy-a',
        name: 'Suggestion copy A/B',
        enabled: false,
        suggestionVariants: [
          {
            id: 'a',
            title: 'Fill gaps this week',
            prompt:
              'Fill schedule gaps for all providers this week between 9-19',
          },
          {
            id: 'b',
            title: 'Optimize open slots',
            prompt:
              'Fill unused slots between 9-19 for all providers for the rest of this week',
          },
        ],
      },
      {
        id: 'classification-appendix-v1',
        name: 'Classifier appendix A/B',
        enabled: false,
        classificationVariants: [
          { id: 'control', label: 'baseline classifier appendix' },
          {
            id: 'fewshot_heavy',
            label: 'extra few-shot examples in appendix',
          },
        ],
        promotedClassificationVariantId: 'control',
      },
    ],
    hitlSlaMinutes: 30,
    verticalPlugin: null,
  },
};
