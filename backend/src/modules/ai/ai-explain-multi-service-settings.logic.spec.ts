import {
  buildMultiServiceSettingsSummary,
  handleExplainMultiServiceSettingsLogic,
} from './ai-explain-multi-service-settings.logic.js';
import { DEFAULT_MULTI_SERVICE_SETTINGS } from '../../common/utils/multi-service-settings.util.js';

describe('ai-explain-multi-service-settings.logic', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: {
        publicBooking: {
          multiService: {
            enabled: true,
            maxServiceCount: 3,
            maxDurationMinutes: 180,
            turnoverBufferMinutes: 10,
            schedulingMode: 'same_visit',
            incompatiblePairMode: 'service',
            incompatiblePairs: [['Massage', 'Facial']],
            incompatibleCategoryPairs: [],
          },
        },
      },
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains enabled multi-service settings', async () => {
    const result = await handleExplainMultiServiceSettingsLogic(
      { businessRepo } as any,
      'biz-1',
      {},
      'Explain multi-service booking settings',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_multi_service_settings');
    expect(result.summary).toContain('enabled');
    expect(result.summary).toContain('3 services');
    expect(result.summary).toContain('same visit');
    expect(result.details?.navigate).toEqual({
      path: '/dashboard/services?tab=multiService',
      label: 'Open Multi-service settings',
    });
  });

  it('explains disabled multi-service settings', () => {
    expect(
      buildMultiServiceSettingsSummary({
        ...DEFAULT_MULTI_SERVICE_SETTINGS,
        enabled: false,
      }),
    ).toContain('disabled');
  });

  it('summarizes incompatible category pairs', () => {
    expect(
      buildMultiServiceSettingsSummary({
        ...DEFAULT_MULTI_SERVICE_SETTINGS,
        enabled: true,
        incompatiblePairMode: 'category',
        incompatibleCategoryPairs: [['Hair', 'Nails']],
      }),
    ).toContain('category pair');
  });

  it('returns clarify when prompt is not recognized', async () => {
    const result = await handleExplainMultiServiceSettingsLogic(
      { businessRepo } as any,
      'biz-1',
      {},
      'List scheduling resources',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns failure when business is not found', async () => {
    const result = await handleExplainMultiServiceSettingsLogic(
      { businessRepo: { findOne: jest.fn(async () => null) } },
      'biz-1',
      {},
      'Explain multi-service booking settings',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('not found');
  });
});
