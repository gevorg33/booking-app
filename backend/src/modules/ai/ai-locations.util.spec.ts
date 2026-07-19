import {
  isCreateLocationPrompt,
  isUpdateLocationPrompt,
  parseCreateLocationFromPrompt,
  parseUpdateLocationFromPrompt,
  rescueLocationsIntent,
  resolveLocationFromList,
} from './ai-locations.util.js';
import { LOCATIONS_RESCUE_SCENARIOS } from './ai-locations.fixtures.js';

describe('ai-locations.util (e2e-bug.146)', () => {
  it.each(LOCATIONS_RESCUE_SCENARIOS)(
    'rescues $id → $expectedAction',
    ({ prompt, expectedAction, paramsPartial }) => {
      const rescued = rescueLocationsIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(expectedAction);

      if (expectedAction === 'create_location') {
        expect(isCreateLocationPrompt(prompt)).toBe(true);
        expect(parseCreateLocationFromPrompt(prompt)).toMatchObject(
          paramsPartial,
        );
      } else {
        expect(isUpdateLocationPrompt(prompt)).toBe(true);
        expect(parseUpdateLocationFromPrompt(prompt)).toMatchObject(
          paramsPartial,
        );
      }
    },
  );

  it('does not rescue already-correct location actions', () => {
    expect(
      rescueLocationsIntent(
        'Add a new business location called QA Test Branch at 123 Test St',
        'create_location',
      ),
    ).toBeNull();
  });

  it('does not treat hours/directions as location mutates', () => {
    expect(isCreateLocationPrompt('Where are you located?')).toBe(false);
    expect(isUpdateLocationPrompt('What are your Saturday hours?')).toBe(
      false,
    );
    expect(rescueLocationsIntent('Where are you located?', 'unknown')).toBeNull();
  });

  it('resolves main/default to the default location', () => {
    const locations = [
      { id: 'a', name: 'Downtown', isDefault: true },
      { id: 'b', name: 'Uptown', isDefault: false },
    ];
    expect(
      resolveLocationFromList(locations, { locationName: 'main' })?.id,
    ).toBe('a');
    expect(
      resolveLocationFromList(locations, { locationName: 'default' })?.id,
    ).toBe('a');
  });
});
