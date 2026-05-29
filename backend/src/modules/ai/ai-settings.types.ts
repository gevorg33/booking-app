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

export interface AiConfidenceThresholds {
  /** Below this → ask user to confirm intent */
  low: number;
  /** At or above this → may auto-execute low-risk plans */
  high: number;
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

export interface AiSettings {
  autopilot: {
    enabled: boolean;
    rules: AutopilotRule[];
  };
  playbooks: BusinessPlaybook[];
  confidence: AiConfidenceThresholds;
  entityMemory?: EntityMemory;
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
};
