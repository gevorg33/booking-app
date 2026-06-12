import { BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES } from './ai-budget-service-discovery.fixtures.js';
import { FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES } from './ai-flexible-availability.fixtures.js';
import { SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES } from './ai-service-rank-discovery.fixtures.js';
import {
  PUBLIC_ONLY_ASSISTANT_ACTIONS,
  buildCustomerClassifierSchema,
} from './customer-ai-command.util.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';

/** Shared discovery appendix blocks that must appear on both public + customer schemas. */
const SHARED_DISCOVERY_CLASSIFIER_APPENDIX = [
  BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES,
  SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES,
  FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES,
] as const;

const SHARED_DISCOVERY_PARAMS = [
  '"maxPrice"',
  '"serviceRank"',
  '"availabilityWindows"',
  '"serviceCategory"',
] as const;

const SHARED_DISCOVERY_PROMPT_SAMPLES = [
  'I need a haircut, I have $50',
  "What's the cheapest haircut you offer?",
  'I want a haircut tomorrow evening or Friday afternoon',
  'gift card / checkout — NO maxPrice',
  'recommend_specialists, serviceCategory=massage — NO serviceRank',
] as const;

describe('ai customer public parity (ai-cmd-customer-0.5 / gap-1)', () => {
  const publicSchema = buildPublicClassifierSchema();
  const customerSchema = buildCustomerClassifierSchema();

  it('includes every public-only assistant action in both schemas', () => {
    for (const action of PUBLIC_ONLY_ASSISTANT_ACTIONS) {
      expect(publicSchema).toContain(action);
      expect(customerSchema).toContain(action);
    }
  });

  it('wires shared discovery classifier appendix on both schemas', () => {
    for (const appendix of SHARED_DISCOVERY_CLASSIFIER_APPENDIX) {
      const sample = appendix.slice(0, Math.min(120, appendix.length));
      expect(publicSchema).toContain(sample);
      expect(customerSchema).toContain(sample);
    }
  });

  it('declares shared discovery params on both schemas', () => {
    for (const param of SHARED_DISCOVERY_PARAMS) {
      expect(publicSchema).toContain(param);
      expect(customerSchema).toContain(param);
    }
  });

  it('documents shared NL samples on both schemas', () => {
    for (const sample of SHARED_DISCOVERY_PROMPT_SAMPLES) {
      expect(publicSchema).toContain(sample);
      expect(customerSchema).toContain(sample);
    }
  });

  it('keeps customer schema as superset of public assistant actions', () => {
    for (const action of PUBLIC_ONLY_ASSISTANT_ACTIONS) {
      expect(customerSchema).toContain(action);
    }
    expect(customerSchema).toContain('book_package');
    expect(publicSchema).not.toContain('book_package');
  });
});
