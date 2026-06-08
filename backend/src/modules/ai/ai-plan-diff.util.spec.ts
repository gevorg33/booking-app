import {
  buildMutationPreviewDiff,
  describeMutationImpact,
  formatMutationStepDescription,
} from './ai-plan-diff.util.js';

describe('ai-plan-diff.util (ai-d9)', () => {
  it('formatMutationStepDescription builds create_booking calendar line', () => {
    const description = formatMutationStepDescription('create_booking', {
      employeeName: 'Gevorg',
      serviceName: 'Massage',
      customerName: 'Maria',
      date: '2026-06-08',
      timeSlot: '10:00',
    });
    expect(description).toContain('Massage');
    expect(description).toContain('Gevorg');
    expect(description).toContain('Maria');
  });

  it('describeMutationImpact covers catalog and calendar mutations', () => {
    expect(describeMutationImpact('create_service', { serviceName: 'Facial' })).toContain(
      'catalog',
    );
    expect(describeMutationImpact('create_booking', {})).toContain('calendar');
  });

  it('buildMutationPreviewDiff returns one preview step', () => {
    const steps = buildMutationPreviewDiff('mark_paid', { customerName: 'Maria' });
    expect(steps).toHaveLength(1);
    expect(steps[0]?.action).toBe('mark_paid');
  });
});
