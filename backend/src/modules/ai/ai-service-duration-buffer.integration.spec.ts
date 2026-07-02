import { UPDATE_SERVICE_DURATION_BUFFER_PROMPTS } from './ai-service-duration-buffer.fixtures.js';
import { handleUpdateServiceDurationBufferLogic } from './ai-service-duration-buffer.logic.js';
import { rescueCatalogIntent } from './ai-catalog.util.js';
import { rescueUpdateServiceDurationBufferIntent } from './ai-service-duration-buffer.util.js';

describe('ai-service-duration-buffer integration (ai-cmd-ext-2.17)', () => {
  const catalog = [
    {
      id: 's1',
      name: 'Massage',
      durationMinutes: 45,
      bufferMinutes: 0,
      isActive: true,
      category: { name: 'Massage' },
    },
  ];

  it.each(UPDATE_SERVICE_DURATION_BUFFER_PROMPTS.slice(0, 4))(
    'rescues unknown prompt $id via catalog rescue',
    ({ prompt, expectedAction }) => {
      expect(rescueCatalogIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
      expect(
        rescueUpdateServiceDurationBufferIntent(prompt, 'unknown')?.action,
      ).toBe(expectedAction);
    },
  );

  it('utility rescue matches catalog rescue', () => {
    const prompt = 'Set all massage services to 60 minutes with 15 min buffer';
    expect(
      rescueUpdateServiceDurationBufferIntent(prompt, 'unknown')?.action,
    ).toBe('update_service_duration_buffer');
    expect(rescueCatalogIntent(prompt, 'unknown')?.action).toBe(
      'update_service_duration_buffer',
    );
  });

  it('does not rescue category move to update_service', () => {
    expect(
      rescueUpdateServiceDurationBufferIntent(
        'Move Neck Massage under service category: Massage',
        'unknown',
      ),
    ).toBeNull();
  });

  it('handleUpdateServiceDurationBufferLogic end-to-end', async () => {
    const result = await handleUpdateServiceDurationBufferLogic(
      {
        serviceService: {
          update: jest.fn(async (id, patch) => ({
            id,
            name: 'Massage',
            durationMinutes: patch.durationMinutes ?? 45,
            bufferMinutes: patch.bufferMinutes ?? 0,
          })),
        },
      } as any,
      'biz-1',
      {},
      catalog as any,
      'Change Neck Massage duration to 45 minutes',
    );
    expect(result.success).toBe(true);
    expect(result.details?.updatedCount).toBe(1);
  });
});
