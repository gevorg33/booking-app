import { join } from 'node:path';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { PROVIDER_MOBILE_CLASSIFIER_RULES } from './ai-provider-mobile.fixtures.js';
import {
  APP_GUIDE_CLASSIFIER_RULES,
  CUSTOMER_APP_GUIDE_CLASSIFIER_RULES,
  PRODUCT_GUIDE_CLASSIFIER_RULES,
  PROVIDER_APP_GUIDE_CLASSIFIER_RULES,
  PUBLIC_APP_GUIDE_CLASSIFIER_RULES,
} from './ai-product-guide.fixtures.js';
import {
  DASHBOARD_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
  CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
  PROVIDER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
  PUBLIC_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
} from './ai-product-guide-empty-state.fixtures.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import { DASHBOARD_INTENT_SCHEMA } from './ai-command-intent-schema.build.js';

describe('ai-product-guide classifier rules (ai-guide-1.6.1)', () => {
  it('exports four surface-specific classifier rule blocks from fixtures', () => {
    for (const rules of [
      APP_GUIDE_CLASSIFIER_RULES,
      PROVIDER_APP_GUIDE_CLASSIFIER_RULES,
      CUSTOMER_APP_GUIDE_CLASSIFIER_RULES,
      PUBLIC_APP_GUIDE_CLASSIFIER_RULES,
    ]) {
      expect(rules.trim().length).toBeGreaterThan(80);
      expect(rules).toMatch(/^- /m);
    }
  });

  it('keeps PRODUCT_GUIDE_CLASSIFIER_RULES as dashboard alias', () => {
    expect(PRODUCT_GUIDE_CLASSIFIER_RULES).toBe(APP_GUIDE_CLASSIFIER_RULES);
  });

  it('documents dashboard guide intents in APP_GUIDE_CLASSIFIER_RULES', () => {
    expect(APP_GUIDE_CLASSIFIER_RULES).toContain('explain_app_feature: READ');
    expect(APP_GUIDE_CLASSIFIER_RULES).toContain('guide_user_flow: READ');
    expect(APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_current_screen: READ',
    );
    expect(APP_GUIDE_CLASSIFIER_RULES).toContain('topicId');
  });

  it('documents provider-specific guide intents in PROVIDER_APP_GUIDE_CLASSIFIER_RULES', () => {
    expect(PROVIDER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_staff_invite: READ',
    );
    expect(PROVIDER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_provider_app_tabs: READ',
    );
    expect(PROVIDER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_team_view_scope: READ',
    );
    expect(PROVIDER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_profile_settings: READ',
    );
    expect(PROVIDER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_assistant_confirm_swipe: READ',
    );
    expect(PROVIDER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_provider_compound_steps: READ',
    );
  });

  it('documents consumer guide intents in CUSTOMER_APP_GUIDE_CLASSIFIER_RULES', () => {
    expect(CUSTOMER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_app_feature: READ — consumer app UI feature semantics',
    );
    expect(CUSTOMER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'activationStep welcome → salon → service → slot → confirm',
    );
    expect(CUSTOMER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'guide_user_flow: READ',
    );
    expect(CUSTOMER_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_current_screen: READ',
    );
  });

  it('documents public booking guide intents in PUBLIC_APP_GUIDE_CLASSIFIER_RULES', () => {
    expect(PUBLIC_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_app_feature: READ — public booking page UI semantics',
    );
    expect(PUBLIC_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'bookingStep professionals → services → checkout',
    );
    expect(PUBLIC_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'guide_user_flow: READ',
    );
    expect(PUBLIC_APP_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_current_screen: READ',
    );
  });

  it('wires APP_GUIDE_CLASSIFIER_RULES into dashboard INTENT_SCHEMA appendix', () => {
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      APP_GUIDE_CLASSIFIER_RULES.trim(),
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'explain_app_feature: READ — explain what a dashboard feature',
    );
  });

  it('wires PROVIDER_APP_GUIDE_CLASSIFIER_RULES into provider mobile classifier appendix', () => {
    expect(PROVIDER_MOBILE_CLASSIFIER_RULES).toContain(
      PROVIDER_APP_GUIDE_CLASSIFIER_RULES,
    );
  });

  it('wires CUSTOMER_APP_GUIDE_CLASSIFIER_RULES into customer classifier schema', () => {
    expect(buildCustomerClassifierSchema()).toContain(
      CUSTOMER_APP_GUIDE_CLASSIFIER_RULES,
    );
  });

  it('wires PUBLIC_APP_GUIDE_CLASSIFIER_RULES into public classifier schema', () => {
    expect(buildPublicClassifierSchema()).toContain(
      PUBLIC_APP_GUIDE_CLASSIFIER_RULES,
    );
    expect(buildPublicClassifierSchema()).toContain(
      PUBLIC_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
    );
  });

  it('documents empty-state guide intents per surface (ai-guide-1.8.9)', () => {
    expect(DASHBOARD_EMPTY_STATE_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_visibility_block: READ',
    );
    expect(PROVIDER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_empty_catalog: READ',
    );
    expect(CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_stripe_not_connected: READ',
    );
    expect(PUBLIC_EMPTY_STATE_GUIDE_CLASSIFIER_RULES).toContain(
      'explain_empty_catalog: READ',
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      DASHBOARD_EMPTY_STATE_GUIDE_CLASSIFIER_RULES.trim(),
    );
    expect(PROVIDER_MOBILE_CLASSIFIER_RULES).toContain(
      PROVIDER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
    );
    expect(buildCustomerClassifierSchema()).toContain(
      CUSTOMER_EMPTY_STATE_GUIDE_CLASSIFIER_RULES,
    );
  });
});
