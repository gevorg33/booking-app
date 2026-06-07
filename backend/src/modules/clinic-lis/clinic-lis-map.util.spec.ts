import {
  mapClinicLabInfoSummary,
  mapClinicLabMachineSummary,
  mapClinicLabInfoListItem,
} from './clinic-lis-map.util.js';
import {
  CLINIC_LAB_INFO_FIXTURES,
  CLINIC_LAB_MACHINE_FIXTURES,
} from './clinic-lis.fixtures.js';

describe('clinic-lis-map.util', () => {
  it('maps lab info summaries', () => {
    const summary = mapClinicLabInfoSummary(
      CLINIC_LAB_INFO_FIXTURES[0] as never,
    );
    expect(summary.name).toBe('In-house hematology');
    expect(summary.labType).toBe('Internal');
  });

  it('maps lab machine summaries with lab info name', () => {
    const summary = mapClinicLabMachineSummary(
      CLINIC_LAB_MACHINE_FIXTURES[0] as never,
    );
    expect(summary.labInfoName).toBe('In-house hematology');
  });

  it('maps list item helpers', () => {
    expect(
      mapClinicLabInfoListItem(CLINIC_LAB_INFO_FIXTURES[1] as never),
    ).toEqual({
      id: 'lab-info-2',
      title: 'Regional reference lab',
    });
  });
});
