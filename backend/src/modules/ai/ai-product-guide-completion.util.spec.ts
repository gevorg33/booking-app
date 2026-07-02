import {
  APP_GUIDE_COMPLETION_SCENARIOS,
  META_GUIDE_COMPLETION_SCENARIOS,
  PROVIDER_GUIDE_COMPLETION_SCENARIOS,
} from './ai-product-guide-completion.fixtures.js';
import {
  ALL_PRODUCT_GUIDE_INTENTS,
  parseAppGuideIntentFromPrompt,
  parseMetaProductGuideIntentFromPrompt,
  parseProductGuideIntentFromPrompt,
  parseProviderProductGuideIntentFromPrompt,
} from './ai-product-guide-completion.util.js';

describe('ai-product-guide-completion.util (ai-guide-1.8.5)', () => {
  it('lists every app and provider guide intent', () => {
    expect(ALL_PRODUCT_GUIDE_INTENTS).toEqual([
      'explain_app_feature',
      'guide_user_flow',
      'explain_current_screen',
      'explain_staff_invite',
      'explain_provider_app_tabs',
      'explain_team_view_scope',
      'explain_profile_settings',
      'explain_assistant_confirm_swipe',
      'explain_provider_compound_steps',
      'explain_ai_settings',
      'explain_ai_suggestions',
      'explain_assistant_approval',
      'explain_visibility_block',
      'explain_empty_catalog',
      'explain_stripe_not_connected',
    ]);
  });

  it.each(APP_GUIDE_COMPLETION_SCENARIOS.map((row) => [row.id, row] as const))(
    'parseAppGuideIntentFromPrompt for $id',
    (_id, scenario) => {
      expect(
        parseAppGuideIntentFromPrompt(
          scenario.action as 'guide_user_flow',
          scenario.prompt,
          scenario.params ?? {},
        ),
      ).toBe(scenario.expectValid);
      expect(
        parseProductGuideIntentFromPrompt(
          scenario.action,
          scenario.prompt,
          scenario.params ?? {},
        ),
      ).toBe(scenario.expectValid);
    },
  );

  it.each(
    PROVIDER_GUIDE_COMPLETION_SCENARIOS.map((row) => [row.id, row] as const),
  )('parseProviderProductGuideIntentFromPrompt for $id', (_id, scenario) => {
    expect(
      parseProviderProductGuideIntentFromPrompt(
        scenario.action as 'explain_staff_invite',
        scenario.prompt,
        scenario.params ?? {},
      ),
    ).toBe(scenario.expectValid);
  });

  it.each(META_GUIDE_COMPLETION_SCENARIOS.map((row) => [row.id, row] as const))(
    'parseMetaProductGuideIntentFromPrompt for $id',
    (_id, scenario) => {
      expect(
        parseMetaProductGuideIntentFromPrompt(
          scenario.action as 'explain_ai_settings',
          scenario.prompt,
          scenario.params ?? {},
        ),
      ).toBe(scenario.expectValid);
      expect(
        parseProductGuideIntentFromPrompt(
          scenario.action,
          scenario.prompt,
          scenario.params ?? {},
        ),
      ).toBe(scenario.expectValid);
    },
  );
});
