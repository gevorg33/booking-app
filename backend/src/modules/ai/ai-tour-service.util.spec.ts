import {
  APPLY_TOUR_PLAYBOOK_PROMPTS,
  CONFIGURE_TOUR_SERVICE_PROMPTS,
  EXPLAIN_TOUR_SERVICES_PROMPTS,
} from './ai-tour-service.fixtures.js';
import { MULTILINGUAL_TOUR_SERVICE_EVAL_SCENARIOS } from './ai-tour-service-multilingual.fixtures.js';
import { rescueListUpcomingTourDeparturesIntent } from './ai-upcoming-tour-departures.util.js';
import {
  isApplyTourPlaybookPrompt,
  isConfigureTourServicePrompt,
  isExplainTourServicesPrompt,
  parseApplyTourPlaybookFromPrompt,
  parseConfigureTourServiceFromPrompt,
  parseExplainTourServicesFromPrompt,
  rescueApplyTourPlaybookIntent,
  rescueConfigureTourServiceIntent,
  rescueExplainTourServicesIntent,
} from './ai-tour-service.util.js';

describe('ai-tour-service.util (ai-cmd-tour-1)', () => {
  it.each(CONFIGURE_TOUR_SERVICE_PROMPTS)(
    'detects configure tour service prompt $id',
    ({ prompt }) => {
      expect(isConfigureTourServicePrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_TOUR_SERVICE_PROMPTS)(
    'parses configure tour service prompt $id',
    ({ prompt, serviceName, enableTour, maxGroupSize, difficulty }) => {
      const parsed = parseConfigureTourServiceFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (serviceName) {
        expect(parsed?.serviceName?.toLowerCase()).toContain(
          serviceName.toLowerCase(),
        );
      }
      if (enableTour) expect(parsed?.enableTour).toBe(true);
      if (maxGroupSize !== undefined) {
        expect(parsed?.maxGroupSize).toBe(maxGroupSize);
      }
      if (difficulty) expect(parsed?.difficulty).toBe(difficulty);
    },
  );

  it('rescues unknown action to configure_tour_service', () => {
    expect(
      rescueConfigureTourServiceIntent(
        'Mark City Tour as a tour with max 12 people',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_tour_service',
      rescueReason: 'configure_tour_service',
    });
  });

  it('does not rescue when action is already configure_tour_service', () => {
    expect(
      rescueConfigureTourServiceIntent(
        'Mark City Tour as a tour with max 12 people',
        'configure_tour_service',
      ),
    ).toBeNull();
  });

  it('does not steal configure_multi_service_settings prompts', () => {
    const prompt = 'Set max 3 services per visit for multi-service booking';
    expect(isConfigureTourServicePrompt(prompt)).toBe(false);
    expect(rescueConfigureTourServiceIntent(prompt, 'unknown')).toBeNull();
  });
});

describe('ai-tour-service explain util (ai-cmd-tour-2)', () => {
  it.each(EXPLAIN_TOUR_SERVICES_PROMPTS)(
    'detects explain tour services prompt $id',
    ({ prompt }) => {
      expect(isExplainTourServicesPrompt(prompt)).toBe(true);
      expect(isConfigureTourServicePrompt(prompt)).toBe(false);
    },
  );

  it.each(EXPLAIN_TOUR_SERVICES_PROMPTS)(
    'parses explain tour services prompt $id',
    ({ prompt, serviceName, daysAhead }) => {
      const parsed = parseExplainTourServicesFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (serviceName) {
        expect(parsed?.serviceName?.toLowerCase()).toContain(
          serviceName.toLowerCase(),
        );
      }
      if (daysAhead) expect(parsed?.daysAhead).toBe(daysAhead);
    },
  );

  it('rescues unknown action to explain_tour_services', () => {
    expect(
      rescueExplainTourServicesIntent(
        'List tour services with group sizes and cover images',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_tour_services',
      rescueReason: 'explain_tour_services',
    });
  });

  it('prefers explain over configure for read-only max group size question', () => {
    const prompt = 'What is the max group size for Full Day City Tour?';
    expect(isExplainTourServicesPrompt(prompt)).toBe(true);
    expect(rescueConfigureTourServiceIntent(prompt, 'unknown')).toBeNull();
  });
});

describe('ai-tour-service apply playbook util (ai-cmd-tour-3)', () => {
  it.each(APPLY_TOUR_PLAYBOOK_PROMPTS)(
    'detects apply tour playbook prompt $id',
    ({ prompt }) => {
      expect(isApplyTourPlaybookPrompt(prompt)).toBe(true);
      expect(isConfigureTourServicePrompt(prompt)).toBe(false);
      expect(isExplainTourServicesPrompt(prompt)).toBe(false);
    },
  );

  it.each(APPLY_TOUR_PLAYBOOK_PROMPTS)(
    'parses apply tour playbook prompt $id',
    ({ prompt }) => {
      expect(parseApplyTourPlaybookFromPrompt(prompt)).toEqual({});
    },
  );

  it('rescues unknown action to apply_tour_playbook', () => {
    expect(
      rescueApplyTourPlaybookIntent('Apply tour playbook', 'unknown'),
    ).toEqual({
      action: 'apply_tour_playbook',
      rescueReason: 'apply_tour_playbook',
    });
  });

  it.each(MULTILINGUAL_TOUR_SERVICE_EVAL_SCENARIOS)(
    'rescues multilingual tour service scenario $id (ai-cmd-tour-4)',
    ({ prompt, expectedAction, paramsPartial }) => {
      if (expectedAction === 'configure_tour_service') {
        const rescued = rescueConfigureTourServiceIntent(prompt, 'unknown');
        expect(rescued?.action).toBe(expectedAction);
        const parsed = parseConfigureTourServiceFromPrompt(prompt);
        expect(parsed).not.toBeNull();
        if (paramsPartial?.serviceName) {
          expect(parsed?.serviceName?.toLowerCase()).toContain(
            String(paramsPartial.serviceName).toLowerCase(),
          );
        }
        if (paramsPartial?.maxGroupSize !== undefined) {
          expect(parsed?.maxGroupSize).toBe(paramsPartial.maxGroupSize);
        }
        if (paramsPartial?.difficulty) {
          expect(parsed?.difficulty).toBe(paramsPartial.difficulty);
        }
        if (paramsPartial?.enableTour) {
          expect(parsed?.enableTour).toBe(true);
        }
        return;
      }

      if (expectedAction === 'list_upcoming_tour_departures') {
        expect(
          rescueListUpcomingTourDeparturesIntent(prompt, 'unknown'),
        ).toEqual({
          action: 'list_upcoming_tour_departures',
          rescueReason: 'list_upcoming_tour_departures',
        });
        return;
      }

      expect(rescueExplainTourServicesIntent(prompt, 'unknown')).toEqual({
        action: 'explain_tour_services',
        rescueReason: 'explain_tour_services',
      });
    },
  );

  it('does not steal bulk_create_catalog or apply_schedule prompts', () => {
    expect(
      isApplyTourPlaybookPrompt('Bulk create catalog category Day Tours'),
    ).toBe(false);
    expect(
      isApplyTourPlaybookPrompt('Apply schedule template to Anna on Monday'),
    ).toBe(false);
    expect(
      rescueApplyTourPlaybookIntent(
        'Apply schedule template to Anna on Monday',
        'unknown',
      ),
    ).toBeNull();
  });
});
