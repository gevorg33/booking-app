import {
  UPDATE_SERVICE_DURATION_BUFFER_PROMPTS,
  isUpdateServiceDurationBufferPrompt,
  parseUpdateServiceDurationBufferFromPrompt,
  rescueUpdateServiceDurationBufferIntent,
  resolveTargetServicesForDurationBuffer,
} from './ai-service-duration-buffer.util.js';

const catalog = [
  {
    id: 's1',
    name: 'Swedish Massage',
    isActive: true,
    category: { name: 'Massage' },
  },
  {
    id: 's2',
    name: 'Deep Tissue Massage',
    isActive: true,
    category: { name: 'Massage' },
  },
  {
    id: 's3',
    name: 'Facial',
    isActive: true,
    category: { name: 'Skin' },
  },
  {
    id: 's4',
    name: 'Neck Massage',
    isActive: true,
    category: { name: 'Massage' },
  },
] as const;

describe('ai-service-duration-buffer.util', () => {
  it.each(UPDATE_SERVICE_DURATION_BUFFER_PROMPTS)(
    'detects update service duration buffer prompt $id',
    ({ prompt }) => {
      expect(isUpdateServiceDurationBufferPrompt(prompt)).toBe(true);
    },
  );

  it.each(UPDATE_SERVICE_DURATION_BUFFER_PROMPTS)(
    'parses update service duration buffer fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseUpdateServiceDurationBufferFromPrompt(prompt, {});
      expect(parsed).not.toBeNull();
      if (paramsPartial?.durationMinutes !== undefined) {
        expect(parsed?.durationMinutes).toBe(paramsPartial.durationMinutes);
      }
      if (paramsPartial?.bufferMinutes !== undefined) {
        expect(parsed?.bufferMinutes).toBe(paramsPartial.bufferMinutes);
      }
      if (paramsPartial?.allServices) {
        expect(parsed?.allServices).toBe(true);
      }
      if (paramsPartial?.serviceName) {
        expect(parsed?.serviceName).toBe(paramsPartial.serviceName);
      }
      if (paramsPartial?.serviceNames) {
        expect(parsed?.serviceNames).toEqual(paramsPartial.serviceNames);
      }
      if (paramsPartial?.categoryName) {
        expect(parsed?.categoryName?.toLowerCase()).toBe(
          String(paramsPartial.categoryName).toLowerCase(),
        );
      }
    },
  );

  it.each(UPDATE_SERVICE_DURATION_BUFFER_PROMPTS)(
    'rescues unknown action to update_service_duration_buffer for $id',
    ({ prompt, expectedAction }) => {
      expect(rescueUpdateServiceDurationBufferIntent(prompt, 'unknown')).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('resolves category-scoped services', () => {
    const parsed = parseUpdateServiceDurationBufferFromPrompt(
      'Set all massage services to 60 minutes with 15 min buffer',
      {},
    )!;
    expect(
      resolveTargetServicesForDurationBuffer([...catalog], parsed).map(
        (s) => s.name,
      ),
    ).toEqual([
      'Swedish Massage',
      'Deep Tissue Massage',
      'Neck Massage',
    ]);
  });

  it('does not treat category move as duration buffer update', () => {
    expect(
      isUpdateServiceDurationBufferPrompt(
        'Move Neck Massage under service category: Massage',
      ),
    ).toBe(false);
  });

  it('does not treat create service as duration buffer update', () => {
    expect(
      isUpdateServiceDurationBufferPrompt('Add service Massage 60min $80'),
    ).toBe(false);
  });
});
