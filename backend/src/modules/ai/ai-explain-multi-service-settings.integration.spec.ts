import { EXPLAIN_MULTI_SERVICE_SETTINGS_PROMPTS } from './ai-explain-multi-service-settings.fixtures.js';
import { handleExplainMultiServiceSettingsLogic } from './ai-explain-multi-service-settings.logic.js';
import { rescueScheduleResourceIntent } from './ai-schedule-resources.util.js';

describe('explain_multi_service_settings AI scenarios', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: {
        publicBooking: {
          multiService: {
            enabled: true,
            maxServiceCount: 4,
            maxDurationMinutes: 240,
            turnoverBufferMinutes: 5,
            schedulingMode: 'per_service',
            incompatiblePairMode: 'service',
            incompatiblePairs: [],
            incompatibleCategoryPairs: [],
          },
        },
      },
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(EXPLAIN_MULTI_SERVICE_SETTINGS_PROMPTS.slice(0, 4))(
    'rescues dashboard prompt $id via schedule rescue',
    ({ prompt }) => {
      expect(rescueScheduleResourceIntent(prompt, 'unknown')?.action).toBe(
        'explain_multi_service_settings',
      );
    },
  );

  it('disambiguates explain from configure limits', () => {
    expect(
      rescueScheduleResourceIntent('Explain multi-service booking settings', 'unknown')
        ?.action,
    ).toBe('explain_multi_service_settings');
    expect(
      rescueScheduleResourceIntent(
        'Enable multi-service booking max 3 services',
        'unknown',
      ),
    ).toBeNull();
  });

  it('executes explain_multi_service_settings handler', async () => {
    const result = await handleExplainMultiServiceSettingsLogic(
      { businessRepo } as any,
      'biz-1',
      {},
      'What are our multi-service booking limits?',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_multi_service_settings');
    expect(result.summary).toContain('4 services');
  });
});
