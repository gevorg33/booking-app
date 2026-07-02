import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLINIC_TEST_RESULT_EXT_DISPATCH_SCENARIOS } from './ai-clinic-test-result-ext-dispatch.fixtures.js';
import {
  assertClinicTestResultExtCommandResultShape,
  dispatchClinicTestResultExtIntent,
  type ClinicTestResultExtDispatchService,
} from './ai-clinic-test-result-ext-dispatch.util.js';
import { CLINIC_TEST_RESULT_EXT_INTENTS } from './ai-clinic-test-result-ext.util.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

describe('ai-clinic-test-result-ext dispatch (ai-cmd-clinic-6-gap-3.2)', () => {
  const businessId = 'biz-1';
  const userId = 'user-1';

  function buildMockService(): jest.Mocked<ClinicTestResultExtDispatchService> {
    return {
      handleUploadPatientResult: jest.fn(),
      handleExplainPatientResults: jest.fn(),
      handleConfigureTestReferenceRange: jest.fn(),
      handleListAbnormalResults: jest.fn(),
    };
  }

  it('maps ext intents to AiClinicTestResultService in registry', () => {
    for (const action of CLINIC_TEST_RESULT_EXT_INTENTS) {
      expect(resolveHandlerForSurface(action, 'dashboard')).toBe(
        'AiClinicTestResultService',
      );
    }
  });

  it('wires executeSingleIntent switch through dispatchClinicTestResultExtIntent', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'dispatchClinicTestResultExtIntent(',
    );
    for (const action of CLINIC_TEST_RESULT_EXT_INTENTS) {
      expect(AI_COMMAND_SERVICE_SOURCE).toContain(`case '${action}':`);
    }
  });

  it.each(CLINIC_TEST_RESULT_EXT_DISPATCH_SCENARIOS)(
    'dispatches $id via $handler and returns CommandResult shape',
    async ({ action, handler, params, prompt, mockResult }) => {
      const service = buildMockService();
      service[handler].mockResolvedValue(mockResult);

      const result = await dispatchClinicTestResultExtIntent(action, service, {
        businessId,
        userId,
        params,
        prompt,
      });

      expect(
        assertClinicTestResultExtCommandResultShape(result, action),
      ).toEqual([]);

      switch (handler) {
        case 'handleUploadPatientResult':
          expect(service.handleUploadPatientResult).toHaveBeenCalledWith(
            businessId,
            params,
            prompt,
          );
          break;
        case 'handleExplainPatientResults':
          expect(service.handleExplainPatientResults).toHaveBeenCalledWith(
            businessId,
            params,
            prompt,
          );
          break;
        case 'handleConfigureTestReferenceRange':
          expect(
            service.handleConfigureTestReferenceRange,
          ).toHaveBeenCalledWith(businessId, userId, params);
          break;
        case 'handleListAbnormalResults':
          expect(service.handleListAbnormalResults).toHaveBeenCalledWith(
            businessId,
            params,
          );
          break;
      }
    },
  );
});
