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

/** ai-e5 — A/B experiment for suggestion copy and auto-execute thresholds. */
export interface AiAbExperiment {
  id: string;
  name: string;
  enabled: boolean;
  suggestionVariants?: AiSuggestionVariant[];
  confidenceHigh?: number;
}

/** ai-e1/e3/e5/e7 — enterprise AI configuration. */
export interface AiEnterpriseSettings {
  defaultLocationId?: string | null;
  /** Maps membership role → AI role profile (e.g. staff → receptionist). */
  roleProfiles?: Partial<Record<string, AiRoleProfile>>;
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

export interface EntityMemory {
  aliases: Record<string, EntityMemoryEntry>;
}

export type RagDocumentType = 'sop' | 'playbook_note' | 'business_note' | 'past_plan';

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
        prompt: 'Fill schedule gaps under 30 minutes for all providers today between 9-19',
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
      prompt: 'Fill schedule gaps between 9-19 for all providers for the rest of this week',
    },
  ],
  playbooks: [
    {
      id: 'salon-weekday',
      name: 'Salon weekday',
      description: 'Apply weekday template and fill 9–19 gaps for the team',
      triggers: ['salon weekday', 'weekday setup', 'standard weekday'],
      prompt: 'Apply weekday template to all providers this week, then fill gaps between 9-19',
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
          { id: 'a', title: 'Fill gaps this week', prompt: 'Fill schedule gaps for all providers this week between 9-19' },
          { id: 'b', title: 'Optimize open slots', prompt: 'Fill unused slots between 9-19 for all providers for the rest of this week' },
        ],
      },
    ],
    hitlSlaMinutes: 30,
    verticalPlugin: null,
  },
};
