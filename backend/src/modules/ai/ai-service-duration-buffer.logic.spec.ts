import { handleUpdateServiceDurationBufferLogic } from './ai-service-duration-buffer.logic.js';
import { UPDATE_SERVICE_DURATION_BUFFER_PROMPTS } from './ai-service-duration-buffer.fixtures.js';

const catalog = [
  {
    id: 's1',
    name: 'Swedish Massage',
    durationMinutes: 45,
    bufferMinutes: 0,
    isActive: true,
    category: { name: 'Massage' },
  },
  {
    id: 's2',
    name: 'Deep Tissue Massage',
    durationMinutes: 60,
    bufferMinutes: 5,
    isActive: true,
    category: { name: 'Massage' },
  },
  {
    id: 's3',
    name: 'Neck Massage',
    durationMinutes: 30,
    bufferMinutes: 0,
    isActive: true,
    category: { name: 'Massage' },
  },
  {
    id: 's4',
    name: 'Haircut',
    durationMinutes: 35,
    bufferMinutes: 0,
    isActive: true,
    category: { name: 'Hair' },
  },
] as const;

function buildDeps() {
  const updates: Array<Record<string, unknown>> = [];
  return {
    deps: {
      serviceService: {
        update: jest.fn(async (id: string, patch: Record<string, unknown>) => {
          const service = catalog.find((s) => s.id === id)!;
          const updated = {
            ...service,
            durationMinutes:
              (patch.durationMinutes as number | undefined) ??
              service.durationMinutes,
            bufferMinutes:
              (patch.bufferMinutes as number | undefined) ??
              service.bufferMinutes,
          };
          updates.push(updated);
          return updated;
        }),
      },
    },
    updates,
  };
}

describe('ai-service-duration-buffer.logic', () => {
  it.each(UPDATE_SERVICE_DURATION_BUFFER_PROMPTS.slice(0, 4))(
    'updates services for fixture $id',
    async ({ prompt }) => {
      const { deps, updates } = buildDeps();
      const result = await handleUpdateServiceDurationBufferLogic(
        deps as any,
        'biz-1',
        {},
        [...catalog] as any,
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('update_service_duration_buffer');
      expect(updates.length).toBeGreaterThan(0);
      expect(result.details?.navigate).toEqual({
        path: '/dashboard/services',
        label: 'Open Services',
      });
    },
  );

  it('updates category scope with duration and buffer', async () => {
    const { deps, updates } = buildDeps();
    const result = await handleUpdateServiceDurationBufferLogic(
      deps as any,
      'biz-1',
      {},
      [...catalog] as any,
      'Set all massage services to 60 minutes with 15 min buffer',
    );
    expect(result.success).toBe(true);
    expect(updates).toHaveLength(3);
    expect(updates.every((s) => s.durationMinutes === 60)).toBe(true);
    expect(updates.every((s) => s.bufferMinutes === 15)).toBe(true);
  });

  it('updates single service duration only', async () => {
    const { deps, updates } = buildDeps();
    const result = await handleUpdateServiceDurationBufferLogic(
      deps as any,
      'biz-1',
      {},
      [...catalog] as any,
      'Change Neck Massage duration to 45 minutes',
    );
    expect(result.success).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0].name).toBe('Neck Massage');
    expect(updates[0].durationMinutes).toBe(45);
  });

  it('clarifies when prompt is ambiguous', async () => {
    const result = await handleUpdateServiceDurationBufferLogic(
      buildDeps().deps as any,
      'biz-1',
      {},
      [...catalog] as any,
      'hello world',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('fails when no services match scope', async () => {
    const result = await handleUpdateServiceDurationBufferLogic(
      buildDeps().deps as any,
      'biz-1',
      {},
      [...catalog] as any,
      'Set all dental services to 60 minutes',
    );
    expect(result.success).toBe(false);
  });
});
