import {
  applyPackageMultiServicePromptHints,
  decomposeDashboardPackageMultiServiceCompoundPrompt,
  disambiguateStaffPackageMultiBooking,
  extractStaffMultiServiceNames,
  inheritPackageMultiServiceFollowUpContext,
  isStaffCartBuildPrompt,
} from './ai-package-multi-service-hints.util.js';

describe('ai-package-multi-service-hints.util', () => {
  const employees = [
    { id: 'e1', name: 'Anna Kim' },
    { id: 'e2', name: 'Gevorg Gasparyan' },
  ];
  const customers = [{ id: 'c1', name: 'Maria Lopez' }];

  it('detects staff cart build prompts', () => {
    expect(isStaffCartBuildPrompt('Add haircut and beard trim to cart')).toBe(
      true,
    );
    expect(isStaffCartBuildPrompt('Add massage to my cart')).toBe(false);
  });

  it('extracts multi-service names from book-and phrasing', () => {
    expect(
      extractStaffMultiServiceNames(
        'Book haircut and beard trim for Maria Tuesday 10am',
      ),
    ).toEqual(['haircut', 'beard trim']);
  });

  it('disambiguates create_booking to package or multi-service', () => {
    expect(
      disambiguateStaffPackageMultiBooking(
        'Book spa day package for James Friday 2pm',
        'create_booking',
      )?.action,
    ).toBe('create_package_booking');

    expect(
      disambiguateStaffPackageMultiBooking(
        'Book haircut and beard trim Tuesday 10am with Anna',
        'create_booking',
      )?.action,
    ).toBe('create_multi_service_booking');
  });

  it('enriches create_package_booking params from prompt', () => {
    const params: Record<string, any> = {};
    applyPackageMultiServicePromptHints(
      'create_package_booking',
      params,
      'Book spa day package for James Friday at 2pm with Anna',
      { employees, customers },
    );
    expect(params.packageName).toBe('Spa Day');
    expect(params.employeeName).toBe('Anna Kim');
  });

  it('inherits availability context into checkout follow-up', () => {
    const params: Record<string, any> = {};
    inheritPackageMultiServiceFollowUpContext(
      params,
      {
        lastAction: 'check_package_line_availability',
        packageName: 'Spa Day',
        date: '06/06/2026',
        customerName: 'James',
      },
      'create_package_booking',
      'book for James at 2pm',
    );
    expect(params.packageName).toBe('Spa Day');
    expect(params.date).toBe('06/06/2026');
    expect(params.customerName).toBe('James');
  });

  it('decomposes package line availability + book compound', () => {
    const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
      'Check package line availability for Spa Day tomorrow and book for James at 2pm',
      employees,
      customers,
    );
    expect(steps.map((s) => s.action)).toEqual([
      'check_package_line_availability',
      'create_package_booking',
    ]);
    expect(steps[0].params.packageName).toBe('Spa Day');
    expect(steps[1].params.packageName).toBe('Spa Day');
  });

  it('decomposes cart + block availability + book compound', () => {
    const steps = decomposeDashboardPackageMultiServiceCompoundPrompt(
      'Add haircut and beard trim to cart, check block availability Tuesday, and book for Maria at 10am with Anna',
      employees,
      customers,
    );
    expect(steps.map((s) => s.action)).toEqual([
      'check_multi_service_block_availability',
      'create_multi_service_booking',
    ]);
    expect(steps[0].params.serviceNames).toEqual(['haircut', 'beard trim']);
    expect(steps[1].params.serviceNames).toEqual(['haircut', 'beard trim']);
    expect(steps[1].params.employeeName).toBe('Anna Kim');
  });
});
