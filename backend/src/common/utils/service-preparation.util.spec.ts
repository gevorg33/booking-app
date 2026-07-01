import {
  buildServicePreparationSnapshot,
  buildServicePreparationSummary,
} from './service-preparation.util.js';

describe('service-preparation.util (ai-cmd-customer-4.3.4)', () => {
  it('builds clinic preparation snapshot', () => {
    const snapshot = buildServicePreparationSnapshot({
      id: 'svc-1',
      name: 'Lipid Panel',
      metadata: {
        serviceType: 'lab_test',
        requiresFasting: true,
        preparationNotes: 'Fast 12 hours before draw.',
      },
    });
    expect(snapshot.requiresFasting).toBe(true);
    expect(snapshot.preparationNotes).toBe('Fast 12 hours before draw.');
  });

  it('builds tour meeting snapshot', () => {
    const snapshot = buildServicePreparationSnapshot({
      id: 'svc-2',
      name: 'City Tour',
      metadata: {
        serviceType: 'tour',
        meetingPoint: 'Main hotel lobby',
        includedItems: 'Water bottle and comfortable shoes',
      },
    });
    expect(snapshot.meetingPoint).toBe('Main hotel lobby');
    expect(snapshot.includedItems).toContain('shoes');
  });

  it('summarizes fasting and preparation aspects', () => {
    const snapshot = buildServicePreparationSnapshot({
      id: 'svc-1',
      name: 'CBC',
      metadata: {
        serviceType: 'lab_test',
        requiresFasting: true,
        preparationNotes: 'Water only.',
      },
    });
    expect(buildServicePreparationSummary(snapshot, 'fasting')).toContain(
      'fasting is required',
    );
    expect(buildServicePreparationSummary(snapshot, 'preparation')).toContain(
      'Water only',
    );
  });

  it('summarizes meeting point and bring-list aspects', () => {
    const snapshot = buildServicePreparationSnapshot({
      id: 'svc-2',
      name: 'City Tour',
      metadata: {
        serviceType: 'tour',
        meetingPoint: 'Main hotel lobby',
        includedItems: 'Comfortable shoes',
      },
    });
    expect(buildServicePreparationSummary(snapshot, 'meeting_point')).toContain(
      'Main hotel lobby',
    );
    expect(buildServicePreparationSummary(snapshot, 'what_to_bring')).toContain(
      'Comfortable shoes',
    );
    expect(buildServicePreparationSummary(snapshot, 'all')).toContain(
      'Main hotel lobby',
    );
  });

  it('returns fallback when no prep details exist', () => {
    const snapshot = buildServicePreparationSnapshot({
      id: 'svc-3',
      name: 'Haircut',
      metadata: {},
    });
    expect(buildServicePreparationSummary(snapshot, 'preparation')).toContain(
      'no visit preparation details',
    );
  });

  it('covers clinic and tour empty-state branches', () => {
    const clinicNoFasting = buildServicePreparationSnapshot({
      id: 'svc-clinic',
      name: 'Urinalysis',
      metadata: { serviceType: 'lab_test', requiresFasting: false },
    });
    expect(
      buildServicePreparationSummary(clinicNoFasting, 'fasting'),
    ).toContain('no fasting requirement');
    expect(
      buildServicePreparationSummary(clinicNoFasting, 'preparation'),
    ).toContain('no preparation notes');

    const tourEmpty = buildServicePreparationSnapshot({
      id: 'svc-tour',
      name: 'Walking Tour',
      metadata: { serviceType: 'tour' },
    });
    expect(
      buildServicePreparationSummary(tourEmpty, 'what_to_bring'),
    ).toContain('no bring-list');
    expect(
      buildServicePreparationSummary(tourEmpty, 'meeting_point'),
    ).toContain('no meeting point');

    const genericBring = buildServicePreparationSnapshot({
      id: 'svc-generic',
      name: 'Haircut',
      metadata: {},
    });
    expect(
      buildServicePreparationSummary(genericBring, 'what_to_bring'),
    ).toContain('no special items');
  });
});
