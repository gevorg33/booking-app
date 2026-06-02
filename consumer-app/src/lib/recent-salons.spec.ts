import { loadRecentSalons, rememberSalon } from './recent-salons.js';

describe('recent-salons', () => {
  it('remembers and lists salons', () => {
    rememberSalon({ slug: 'a', name: 'Salon A' });
    rememberSalon({ slug: 'b', name: 'Salon B' });
    const list = loadRecentSalons();
    expect(list[0]?.slug).toBe('b');
    expect(list.some((s) => s.slug === 'a')).toBe(true);
  });

  it('returns empty list when storage is corrupt', () => {
    localStorage.setItem('consumer_recent_salons', 'not-json');
    expect(loadRecentSalons()).toEqual([]);
  });
});
