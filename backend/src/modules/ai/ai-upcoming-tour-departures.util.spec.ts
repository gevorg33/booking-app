import { LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS } from './ai-upcoming-tour-departures.fixtures.js';
import { EXPLAIN_TOUR_SERVICES_PROMPTS } from './ai-tour-service.fixtures.js';
import {
  isListUpcomingTourDeparturesPrompt,
  parseListUpcomingTourDeparturesFromPrompt,
  rescueListUpcomingTourDeparturesIntent,
} from './ai-upcoming-tour-departures.util.js';
import { isExplainTourServicesPrompt } from './ai-tour-service.util.js';

describe('ai-upcoming-tour-departures.util (ai-cmd-tour-8)', () => {
  it.each(LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS)(
    'detects list upcoming tour departures prompt $id',
    ({ prompt }) => {
      expect(isListUpcomingTourDeparturesPrompt(prompt)).toBe(true);
      expect(parseListUpcomingTourDeparturesFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(LIST_UPCOMING_TOUR_DEPARTURES_PROMPTS)(
    'rescues unknown action to list_upcoming_tour_departures for $id',
    ({ prompt }) => {
      expect(rescueListUpcomingTourDeparturesIntent(prompt, 'unknown')).toEqual(
        {
          action: 'list_upcoming_tour_departures',
          rescueReason: 'list_upcoming_tour_departures',
        },
      );
    },
  );

  it('does not steal catalog-only tour service prompts', () => {
    for (const { prompt } of EXPLAIN_TOUR_SERVICES_PROMPTS) {
      expect(isListUpcomingTourDeparturesPrompt(prompt)).toBe(false);
      expect(isExplainTourServicesPrompt(prompt)).toBe(true);
    }
  });

  it('parses serviceName and daysAhead from params', () => {
    const parsed = parseListUpcomingTourDeparturesFromPrompt(
      'List upcoming tour departures',
      { serviceName: 'City Tour', daysAhead: 7 },
    );
    expect(parsed).toEqual({
      serviceName: 'City Tour',
      serviceId: undefined,
      daysAhead: 7,
    });
  });
});
