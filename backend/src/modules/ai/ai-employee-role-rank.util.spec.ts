import {
  employeeRoleMatchesHint,
  enrichEmployeeRoleRankFromPrompt,
  extractEmployeeRoleFromPrompt,
  isEmployeeRoleOccupation,
  isEmployeeRoleRankPrompt,
} from './ai-employee-role-rank.util.js';
import { rescueServiceRankDiscoveryIntent } from './ai-service-rank-discovery.util.js';

describe('ai-employee-role-rank.util', () => {
  it('detects top rated cosmetologist as employee role rank prompt', () => {
    expect(isEmployeeRoleRankPrompt('top rated cosmetologist')).toBe(true);
    expect(extractEmployeeRoleFromPrompt('top rated cosmetologist')).toBe(
      'cosmetologist',
    );
  });

  it('detects who are the top-rated cosmetologists phrasing', () => {
    const prompt = 'who are the Top-rated Cosmetologists';
    expect(isEmployeeRoleRankPrompt(prompt)).toBe(true);
    expect(extractEmployeeRoleFromPrompt(prompt)).toBe('cosmetologist');
    expect(
      rescueServiceRankDiscoveryIntent(
        prompt,
        'check_providers_for_service',
        'customer',
      ),
    ).toEqual({
      action: 'recommend_specialists',
      rescueReason: 'rank_provider_specialists',
      params: { employeeRole: 'cosmetologist' },
    });
  });

  it('matches provider metadata role/title case-insensitively', () => {
    expect(
      employeeRoleMatchesHint('Cosmetologist', undefined, 'cosmetologist'),
    ).toBe(true);
    expect(
      employeeRoleMatchesHint(
        undefined,
        'Massage specialist',
        'massage specialist',
      ),
    ).toBe(true);
    expect(employeeRoleMatchesHint('Barber', undefined, 'stylist')).toBe(false);
  });

  it('matches a single role token against compound titles', () => {
    expect(
      employeeRoleMatchesHint(
        'Permanent + Alexandrite',
        undefined,
        'permanent specialist',
      ),
    ).toBe(true);
    expect(
      employeeRoleMatchesHint(
        'Permanent + Alexandrite',
        undefined,
        'permanent',
      ),
    ).toBe(true);
    expect(
      employeeRoleMatchesHint(
        'Permanent + Alexandrite',
        undefined,
        'alexandrite specialist',
      ),
    ).toBe(true);
  });

  it('extracts permanent specialist from top permanent specialist prompt', () => {
    expect(extractEmployeeRoleFromPrompt('top permanent specialist')).toBe(
      'permanent specialist',
    );
  });

  it('enriches employeeRole and clears misclassified serviceCategory', () => {
    expect(
      enrichEmployeeRoleRankFromPrompt(
        { serviceCategory: 'cosmetologist' },
        'top rated cosmetologist',
      ),
    ).toEqual({ employeeRole: 'cosmetologist' });
  });

  it('keeps lash specialist as service category rank, not employee role', () => {
    expect(
      extractEmployeeRoleFromPrompt(
        'Who is the best rated lash specialist this week?',
      ),
    ).toBeNull();
    expect(isEmployeeRoleOccupation('lash')).toBe(false);
  });

  it('rescues unknown top rated cosmetologist to recommend_specialists', () => {
    expect(
      rescueServiceRankDiscoveryIntent(
        'top rated cosmetologist',
        'unknown',
        'customer',
      ),
    ).toEqual({
      action: 'recommend_specialists',
      rescueReason: 'rank_provider_specialists',
      params: { employeeRole: 'cosmetologist' },
    });
  });
});
