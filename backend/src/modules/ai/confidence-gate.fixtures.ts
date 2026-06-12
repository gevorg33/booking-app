import type { ConfidenceGateDecision } from './command-understanding.types.js';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';
import {
  DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE,
  DEFAULT_SEMANTIC_SKIP_CONFIDENCE,
} from './confidence-gate.util.js';

export type ConfidenceGateScenario = {
  id: string;
  action: string;
  confidence: number | undefined;
  expectedShouldEscalate: boolean;
  expectedDecision: ConfidenceGateDecision;
};

export type ConfidenceGateSemanticEscalationScenario = {
  id: string;
  action: string;
  confidence: number;
  expectedShouldEscalate: boolean;
  expectedGateDecision: ConfidenceGateDecision;
  expectSemanticMatchCalled: boolean;
  expectedSemanticTraceAction: 'skipped' | string;
};

/** Canonical acceptance cases for pipe-1.3.4. */
export const CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS: ConfidenceGateSemanticEscalationScenario[] =
  [
    {
      id: 'pipe-1.3.4-high-confidence-skips-semantic',
      action: 'show_appointments',
      confidence: 0.95,
      expectedShouldEscalate: false,
      expectedGateDecision: 'skip_semantic',
      expectSemanticMatchCalled: false,
      expectedSemanticTraceAction: 'skipped',
    },
    {
      id: 'pipe-1.3.4-unknown-at-0.20-escalates',
      action: 'unknown',
      confidence: 0.2,
      expectedShouldEscalate: true,
      expectedGateDecision: 'escalate_semantic',
      expectSemanticMatchCalled: true,
      expectedSemanticTraceAction: 'create_booking',
    },
  ];

export const CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIO_IDS =
  CONFIDENCE_GATE_SEMANTIC_ESCALATION_SCENARIOS.map((scenario) => scenario.id);

/** Default-band scenarios for pipe-1.3.2 (0.65 low / 0.82 high). */
export const CONFIDENCE_GATE_SCENARIOS: ConfidenceGateScenario[] = [
  {
    id: 'unknown-at-0.20-escalates',
    action: 'unknown',
    confidence: 0.2,
    expectedShouldEscalate: true,
    expectedDecision: 'escalate_semantic',
  },
  {
    id: 'unknown-high-confidence-still-escalates',
    action: 'unknown',
    confidence: 0.99,
    expectedShouldEscalate: true,
    expectedDecision: 'escalate_semantic',
  },
  {
    id: 'low-confidence-0.20-escalates',
    action: 'create_booking',
    confidence: 0.2,
    expectedShouldEscalate: true,
    expectedDecision: 'escalate_semantic',
  },
  {
    id: 'below-low-threshold-0.64-escalates',
    action: 'create_booking',
    confidence: DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE - 0.01,
    expectedShouldEscalate: true,
    expectedDecision: 'escalate_semantic',
  },
  {
    id: 'at-low-threshold-0.65-ambiguous',
    action: 'create_booking',
    confidence: DEFAULT_SEMANTIC_ESCALATION_CONFIDENCE,
    expectedShouldEscalate: false,
    expectedDecision: 'ambiguous_band',
  },
  {
    id: 'ambiguous-band-0.70',
    action: 'create_booking',
    confidence: 0.7,
    expectedShouldEscalate: false,
    expectedDecision: 'ambiguous_band',
  },
  {
    id: 'just-below-high-0.81-ambiguous',
    action: 'show_appointments',
    confidence: DEFAULT_SEMANTIC_SKIP_CONFIDENCE - 0.01,
    expectedShouldEscalate: false,
    expectedDecision: 'ambiguous_band',
  },
  {
    id: 'at-high-threshold-0.82-skips',
    action: 'show_appointments',
    confidence: DEFAULT_SEMANTIC_SKIP_CONFIDENCE,
    expectedShouldEscalate: false,
    expectedDecision: 'skip_semantic',
  },
  {
    id: 'high-confidence-0.95-skips',
    action: 'show_appointments',
    confidence: 0.95,
    expectedShouldEscalate: false,
    expectedDecision: 'skip_semantic',
  },
  {
    id: 'missing-confidence-escalates',
    action: 'create_booking',
    confidence: undefined,
    expectedShouldEscalate: true,
    expectedDecision: 'escalate_semantic',
  },
];

export type AiSettingsConfidenceGateScenario = {
  id: string;
  aiLow: number;
  aiHigh: number;
  sessionHighOverride?: number;
  action: string;
  confidence: number;
  expectedShouldEscalate: boolean;
};

/** AiSettingsService thresholds override util defaults (pipe-1.3.3). */
export const AI_SETTINGS_CONFIDENCE_GATE_SCENARIOS: AiSettingsConfidenceGateScenario[] =
  [
    {
      id: 'ai-settings-0.60-ambiguous-not-util-escalate',
      aiLow: DEFAULT_AI_SETTINGS.confidence.low,
      aiHigh: DEFAULT_AI_SETTINGS.confidence.high,
      action: 'create_booking',
      confidence: 0.6,
      expectedShouldEscalate: false,
    },
    {
      id: 'ai-settings-0.50-below-low-escalates',
      aiLow: DEFAULT_AI_SETTINGS.confidence.low,
      aiHigh: DEFAULT_AI_SETTINGS.confidence.high,
      action: 'create_booking',
      confidence: 0.5,
      expectedShouldEscalate: true,
    },
    {
      id: 'session-ab-high-0.88-skips',
      aiLow: DEFAULT_AI_SETTINGS.confidence.low,
      aiHigh: DEFAULT_AI_SETTINGS.confidence.high,
      sessionHighOverride: 0.9,
      action: 'show_appointments',
      confidence: 0.88,
      expectedShouldEscalate: false,
    },
    {
      id: 'session-ab-high-0.89-still-ambiguous',
      aiLow: DEFAULT_AI_SETTINGS.confidence.low,
      aiHigh: DEFAULT_AI_SETTINGS.confidence.high,
      sessionHighOverride: 0.9,
      action: 'show_appointments',
      confidence: 0.89,
      expectedShouldEscalate: false,
    },
  ];
