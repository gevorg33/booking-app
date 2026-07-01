import { validateCommand } from './command-completion.validator.js';
import { handleFindMySavedSalonsLogic } from './ai-find-my-saved-salons.logic.js';
import { handleSwitchSalonTenantLogic } from './ai-switch-salon-tenant.logic.js';
import { FIND_MY_SAVED_SALONS_PROMPTS } from './ai-find-my-saved-salons.fixtures.js';
import { SWITCH_SALON_TENANT_PROMPTS } from './ai-switch-salon-tenant.fixtures.js';
import { rescueFindMySavedSalonsIntent } from './ai-find-my-saved-salons.util.js';
import { rescueSwitchSalonTenantIntent } from './ai-switch-salon-tenant.util.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';
import {
  AI_COMMAND_EVAL_FIND_MY_SAVED_SALONS_CASES,
  AI_COMMAND_EVAL_SWITCH_SALON_TENANT_CASES,
} from './eval/ai-command-eval.cases.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('saved salons integration (ai-cmd-customer-4.17.4)', () => {
  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it.each(FIND_MY_SAVED_SALONS_PROMPTS.slice(0, 3))(
    'validates find_my_saved_salons $id',
    async ({ prompt }) => {
      expect(
        validateCommand({
          action: 'find_my_saved_salons',
          params: {},
          enrichedParams: {},
          entities: {},
          reasoning: 'test',
          confidence: 0.9,
          prompt,
        }).issues,
      ).toEqual([]);
      const result = await handleFindMySavedSalonsLogic(
        { recentSalons: [{ slug: 'demo-salon', name: 'Demo Salon' }] },
        prompt,
      );
      expect(result.success).toBe(true);
    },
  );

  it.each(SWITCH_SALON_TENANT_PROMPTS.slice(0, 3))(
    'validates switch_salon_tenant $id',
    async ({ prompt }) => {
      expect(
        validateCommand({
          action: 'switch_salon_tenant',
          params: {},
          enrichedParams: {},
          entities: {},
          reasoning: 'test',
          confidence: 0.9,
          prompt,
        }).issues,
      ).toEqual([]);
      const result = await handleSwitchSalonTenantLogic(
        {
          recentSalons: [
            { slug: 'glow-nails', name: 'Glow Nails' },
            { slug: 'demo-salon', name: 'Demo Salon' },
          ],
          slug: 'demo-salon',
        },
        prompt,
      );
      expect(result.action).toBe('switch_salon_tenant');
    },
  );

  it('pipeline rescues switch before find', () => {
    expect(
      rescue.rescue({
        prompt: 'Go back to Glow Nails',
        action: 'unknown',
        params: {},
        surface: 'customer',
      })?.action,
    ).toBe('switch_salon_tenant');
    expect(
      rescue.rescue({
        prompt: 'Show my saved salons',
        action: 'unknown',
        params: {},
        surface: 'customer',
      })?.action,
    ).toBe('find_my_saved_salons');
  });

  it('util rescues switch from find mislabel', () => {
    expect(
      rescueSwitchSalonTenantIntent(
        'Switch to Demo Salon',
        'find_my_saved_salons',
      )?.action,
    ).toBe('switch_salon_tenant');
    expect(
      rescueFindMySavedSalonsIntent('Recent salons I visited', 'list_providers')
        ?.action,
    ).toBe('find_my_saved_salons');
  });

  it('passes deterministic eval golden cases', () => {
    for (const evalCase of AI_COMMAND_EVAL_FIND_MY_SAVED_SALONS_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
    for (const evalCase of AI_COMMAND_EVAL_SWITCH_SALON_TENANT_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).passed).toBe(true);
    }
  });
});
