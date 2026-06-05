import {
  BUSINESS_TYPE_TO_PLAYBOOK,
  getVerticalPlaybook,
  resolveVerticalPlaybookId,
  VERTICAL_PLAYBOOKS,
} from './vertical-playbooks.constants.js';
import { TOUR_SERVICE_TYPE } from '../../common/utils/tour-service.util.js';
import { isKnownBusinessType } from './business-types.constants.js';

describe('vertical-playbooks.constants (tour)', () => {
  it('maps tour_operator to tour playbook', () => {
    expect(resolveVerticalPlaybookId('tour_operator')).toBe('tour');
    expect(BUSINESS_TYPE_TO_PLAYBOOK.tour_operator).toBe('tour');
    expect(isKnownBusinessType('tour_operator')).toBe(true);
  });

  it('exposes tour playbook categories with tour metadata on services', () => {
    const playbook = getVerticalPlaybook('tour_operator');
    expect(playbook.id).toBe('tour');
    expect(playbook.categories.map((c) => c.name)).toEqual(
      expect.arrayContaining(['Day Tours', 'Multi-Day Tours', 'Private Tours']),
    );

    const allServices = playbook.categories.flatMap((c) => c.services);
    expect(allServices.length).toBeGreaterThanOrEqual(4);
    expect(allServices.every((s) => s.serviceType === TOUR_SERVICE_TYPE)).toBe(
      true,
    );

    const multiDay = allServices.find((s) => s.name === '3-Day Mountain Trek');
    expect(multiDay).toMatchObject({
      durationMinutes: 4320,
      durationDays: 3,
      maxGroupSize: 8,
      difficulty: 'challenging',
    });
  });

  it('defines full-week tour operating hours template', () => {
    const template = getVerticalPlaybook('tour_operator').scheduleTemplates[0];
    expect(template?.name).toBe('Tour operating hours');
    expect(template?.applyDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(template?.timePeriods[0]).toMatchObject({
      startTime: '08:00',
      endTime: '18:00',
    });
  });

  it('maps polyclinic and clinic business types to clinic playbook', () => {
    expect(resolveVerticalPlaybookId('polyclinic')).toBe('clinic');
    expect(resolveVerticalPlaybookId('clinic')).toBe('clinic');
    expect(isKnownBusinessType('polyclinic')).toBe(true);
    expect(isKnownBusinessType('clinic')).toBe(true);
  });

  it('includes laboratory services with lab_test type in clinic playbook', () => {
    const playbook = getVerticalPlaybook('polyclinic');
    const labCategory = playbook.categories.find(
      (c) => c.name === 'Laboratory',
    );
    expect(labCategory).toBeDefined();
    const labServices = labCategory?.services ?? [];
    expect(labServices.some((s) => s.serviceType === 'lab_test')).toBe(true);
    const lipid = labServices.find((s) => s.name === 'Lipid panel');
    expect(lipid).toMatchObject({
      serviceType: 'lab_test',
      requiresFasting: true,
    });
  });

  it('defines weekday and Saturday clinic hours', () => {
    const templates = getVerticalPlaybook('clinic').scheduleTemplates;
    expect(templates.map((t) => t.name)).toEqual(
      expect.arrayContaining(['Clinic weekday hours', 'Saturday clinic hours']),
    );
    expect(templates[0]?.timePeriods[0]).toMatchObject({
      startTime: '09:00',
      endTime: '17:00',
    });
    expect(templates[1]?.timePeriods[0]).toMatchObject({
      startTime: '09:00',
      endTime: '13:00',
    });
  });

  it('includes general practice and cardiology consultation types', () => {
    const playbook = getVerticalPlaybook('clinic');
    const gp = playbook.categories.find((c) => c.name === 'General Practice');
    const cardio = playbook.categories.find((c) => c.name === 'Cardiology');
    expect(gp?.services.some((s) => s.serviceType === 'consultation')).toBe(
      true,
    );
    expect(cardio?.services.some((s) => s.serviceType === 'procedure')).toBe(
      true,
    );
  });

  it('keeps salon playbook unchanged', () => {
    expect(VERTICAL_PLAYBOOKS.salon.id).toBe('salon');
    expect(resolveVerticalPlaybookId('hair_salon')).toBe('salon');
    expect(resolveVerticalPlaybookId('dental')).toBe('clinic');
  });
});
