import { describe, expect, it } from '@jest/globals';
import { PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS } from './ai-provider-mark-multi-service-step-done.fixtures.js';
import {
  isMarkMultiServiceStepDonePrompt,
  parseMarkMultiServiceStepDoneFromPrompt,
  rescueMarkMultiServiceStepDoneIntent,
} from './ai-provider-mark-multi-service-step-done.util.js';
import { isMarkVisitCompletePrompt } from './ai-provider-mark-visit-complete.util.js';
import { isIntentAllowedOnSurface } from './ai-command-registry.util.js';

describe('ai-provider-mark-multi-service-step-done.util (e2e-bug.241 / ai-cmd-provider-5.18.3)', () => {
  it('registers mark_multi_service_step_done on provider surface', () => {
    expect(
      isIntentAllowedOnSurface('mark_multi_service_step_done', 'provider'),
    ).toBe(true);
  });

  it.each(
    PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('detects %s', (_id, prompt) => {
    expect(isMarkMultiServiceStepDonePrompt(prompt as string)).toBe(true);
  });

  it.each(
    PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
    ]),
  )('does not steal into mark_visit_complete for %s', (_id, prompt) => {
    expect(isMarkVisitCompletePrompt(prompt as string)).toBe(false);
  });

  it.each(
    PROVIDER_MARK_MULTI_SERVICE_STEP_DONE_PROMPT_SCENARIOS.map((s) => [
      s.id,
      s.prompt,
      s.paramsPartial,
    ]),
  )('rescues %s from unknown with params', (_id, prompt, paramsPartial) => {
    const rescued = rescueMarkMultiServiceStepDoneIntent(
      prompt as string,
      'unknown',
    );
    expect(rescued?.action).toBe('mark_multi_service_step_done');
    if (paramsPartial && 'stepIndex' in paramsPartial) {
      expect(rescued?.params.stepIndex).toBe(paramsPartial.stepIndex);
    }
    if (paramsPartial && 'serviceName' in paramsPartial) {
      expect(rescued?.params.serviceName).toBe(paramsPartial.serviceName);
    }
  });

  it('parses stepIndex and serviceName', () => {
    expect(
      parseMarkMultiServiceStepDoneFromPrompt('Finish step 1 of spa day'),
    ).toEqual({ stepIndex: 1 });
    expect(
      parseMarkMultiServiceStepDoneFromPrompt('Complete blowdry leg'),
    ).toEqual({
      serviceName: 'blowdry',
    });
    expect(
      parseMarkMultiServiceStepDoneFromPrompt('Complete the manicure leg'),
    ).toEqual({ serviceName: 'manicure' });
  });

  it.each([
    ['complete-visit-en', 'Mark visit complete'],
    ['finish-appointment-en', 'Finish this appointment'],
    ['paid-en', 'Mark as paid'],
    ['in-progress-en', 'Mark in progress'],
  ])('rejects negative %s', (_id, prompt) => {
    expect(isMarkMultiServiceStepDonePrompt(prompt)).toBe(false);
    expect(rescueMarkMultiServiceStepDoneIntent(prompt, 'unknown')).toBeNull();
  });

  it('does not re-rescue when already mark_multi_service_step_done', () => {
    expect(
      rescueMarkMultiServiceStepDoneIntent(
        'Finish step 1',
        'mark_multi_service_step_done',
      ),
    ).toBeNull();
  });
});
