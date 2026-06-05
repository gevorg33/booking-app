import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';
import {
  BUSINESS_TYPE_TO_PLAYBOOK,
  getVerticalPlaybook,
  resolveVerticalPlaybookId,
  VERTICAL_PLAYBOOKS,
} from './vertical-playbooks.constants.js';

describe('vertical-playbooks.constants', () => {
  it('maps business types to salon or clinic playbooks', () => {
    expect(resolveVerticalPlaybookId('hair_salon')).toBe('salon');
    expect(resolveVerticalPlaybookId('beauty_clinic')).toBe('clinic');
    expect(resolveVerticalPlaybookId('dental')).toBe('clinic');
    expect(resolveVerticalPlaybookId('unknown_type')).toBe('salon');
  });

  it('covers all documented business types', () => {
    expect(Object.keys(BUSINESS_TYPE_TO_PLAYBOOK).sort()).toEqual(
      [
        'barbershop',
        'beauty_clinic',
        'dental',
        'hair_salon',
        'massage',
        'nail_salon',
        'other',
        'spa',
      ].sort(),
    );
  });

  it('returns salon playbook with categories and weekday + Saturday templates', () => {
    const playbook = getVerticalPlaybook('hair_salon');
    expect(playbook.id).toBe('salon');
    expect(playbook.labelKey).toBe('onboarding.playbooks.salon');
    expect(playbook.categories.length).toBeGreaterThanOrEqual(3);
    expect(playbook.scheduleTemplates).toHaveLength(2);
    expect(playbook.scheduleTemplates[0]?.timePeriods[0]?.type).toBe(
      TemplatePeriodType.SERVICE_BLOCK,
    );
  });

  it('returns clinic playbook with lunch unavailable block', () => {
    const playbook = getVerticalPlaybook('dental');
    expect(playbook.id).toBe('clinic');
    const weekday = playbook.scheduleTemplates[0];
    const lunch = weekday?.timePeriods.find(
      (p) => p.type === TemplatePeriodType.UNAVAILABLE_BLOCK,
    );
    expect(lunch).toMatchObject({
      startTime: '12:00',
      endTime: '13:00',
      placeholderLabel: 'Lunch break',
    });
  });

  it('exposes both playbooks in registry', () => {
    expect(Object.keys(VERTICAL_PLAYBOOKS)).toEqual(['salon', 'clinic']);
  });
});
