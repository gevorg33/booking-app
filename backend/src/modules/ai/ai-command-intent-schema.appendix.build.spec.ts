import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DASHBOARD_INTENT_SCHEMA,
  buildDashboardIntentSchema,
} from './ai-command-intent-schema.build.js';
import {
  DASHBOARD_INTENT_SCHEMA_APPENDIX_SECTIONS,
  buildDashboardIntentSchemaAppendix,
} from './ai-command-intent-schema.appendix.build.js';
import { APP_GUIDE_CLASSIFIER_RULES } from './ai-product-guide.fixtures.js';
import { CHECK_AND_BOOK_CLASSIFIER_RULES } from './ai-check-and-book.fixtures.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

const APPENDIX_BUILD_SOURCE = readFileSync(
  join(__dirname, 'ai-command-intent-schema.appendix.build.ts'),
  'utf8',
);

describe('ai-command-intent-schema appendix (ai-cmd-ext-6.3)', () => {
  it('builds appendix from domain *_CLASSIFIER_RULES imports only', () => {
    expect(DASHBOARD_INTENT_SCHEMA_APPENDIX_SECTIONS.length).toBeGreaterThan(60);
    expect(APPENDIX_BUILD_SOURCE).not.toMatch(/^- /m);
    expect(buildDashboardIntentSchemaAppendix()).toContain(
      CHECK_AND_BOOK_CLASSIFIER_RULES.trim(),
    );
    expect(buildDashboardIntentSchemaAppendix()).toContain(
      APP_GUIDE_CLASSIFIER_RULES.trim(),
    );
  });

  it('includes domain appendix in DASHBOARD_INTENT_SCHEMA', () => {
    expect(DASHBOARD_INTENT_SCHEMA).toContain('Rules:');
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      'explain_app_feature: READ — explain what a dashboard feature',
    );
    expect(DASHBOARD_INTENT_SCHEMA).toContain('check_providers_for_service: READ');
    expect(DASHBOARD_INTENT_SCHEMA).toBe(buildDashboardIntentSchema());
  });

  it('does not keep inline classifier prose in AiCommandService', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain('const INTENT_SCHEMA =');
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain('CLASSIFIER_RULES');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('DASHBOARD_INTENT_SCHEMA');
  });

  it('does not duplicate runtime domainClassifierRules append', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain('domainClassifierRules');
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain(
      'BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES',
    );
  });
});
