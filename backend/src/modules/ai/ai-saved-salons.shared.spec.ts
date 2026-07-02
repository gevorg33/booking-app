import {
  extractSalonHintFromPrompt,
  matchRecentSalonByHint,
  parseRecentSalonsFromParams,
} from './ai-saved-salons.shared.js';

describe('ai-saved-salons.shared', () => {
  it('parses recent salons from params', () => {
    expect(
      parseRecentSalonsFromParams({
        recentSalons: [
          { slug: 'demo-salon', name: 'Demo Salon' },
          { bad: true },
        ],
      }),
    ).toEqual([{ slug: 'demo-salon', name: 'Demo Salon' }]);
  });

  it('matches salon by name or slug', () => {
    const salons = [
      { slug: 'glow-nails', name: 'Glow Nails' },
      { slug: 'demo-salon', name: 'Demo Salon' },
    ];
    expect(matchRecentSalonByHint(salons, 'Glow Nails')).toEqual(salons[0]);
    expect(matchRecentSalonByHint(salons, 'demo-salon')).toEqual(salons[1]);
    expect(
      matchRecentSalonByHint(
        [
          { slug: 'glow-nails', name: 'Glow Nails Downtown' },
          { slug: 'glow-spa', name: 'Glow Nails Uptown' },
        ],
        'Glow Nails',
      ),
    ).toBe('ambiguous');
    expect(matchRecentSalonByHint(salons, 'Missing')).toBeNull();
  });

  it('extracts salon hint from prompt', () => {
    expect(extractSalonHintFromPrompt('Go back to Glow Nails')).toBe(
      'Glow Nails',
    );
  });
});
