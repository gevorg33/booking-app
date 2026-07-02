import {
  formatLookupAssignmentDiscoveryNote,
  resolveLookupAssignmentService,
} from './ai-dashboard-lookup-assignment.logic.js';

const CATALOG = [
  { id: 'h-30', name: 'Basic cut', price: 30, serviceCategory: 'haircut' },
  { id: 'h-60', name: 'Premium cut', price: 60, serviceCategory: 'haircut' },
  {
    id: 'm-95',
    name: 'Massage premium',
    price: 95,
    serviceCategory: 'massage',
  },
];

describe('resolveLookupAssignmentService (ai-cmd-ext-1.5)', () => {
  const resolveByName = (name: string) =>
    CATALOG.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));

  it('resolves explicit service by name', () => {
    const result = resolveLookupAssignmentService(
      CATALOG,
      { serviceName: 'Premium cut' },
      resolveByName,
    );
    expect(result.service?.id).toBe('h-60');
  });

  it('picks cheapest haircut under budget', () => {
    const result = resolveLookupAssignmentService(
      CATALOG,
      {
        serviceCategory: 'haircut',
        maxPrice: 50,
        serviceRank: 'lowest_price',
      },
      resolveByName,
    );
    expect(result.service?.id).toBe('h-30');
  });

  it('picks premium service by rank', () => {
    const result = resolveLookupAssignmentService(
      CATALOG,
      { serviceCategory: 'massage', serviceRank: 'highest_price' },
      resolveByName,
    );
    expect(result.service?.id).toBe('m-95');
  });

  it('returns no-match summary when budget excludes all', () => {
    const result = resolveLookupAssignmentService(
      CATALOG,
      { serviceCategory: 'haircut', maxPrice: 20 },
      resolveByName,
    );
    expect(result.service).toBeNull();
    expect(result.noMatchSummary).toMatch(/under \$20|Nothing/i);
  });

  it('formats discovery note for rank + budget', () => {
    expect(
      formatLookupAssignmentDiscoveryNote(
        { maxPrice: 50, serviceRank: 'lowest_price' },
        'Basic cut',
      ),
    ).toContain('Basic cut');
  });
});
