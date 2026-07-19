import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  applyPriceAdjustment,
  computeRevenueForecast,
  enrichPaymentSweepParams,
  extractMenuTextFromParams,
  filterBookingsForPaymentSweep,
  filterSlotsByTimeOfDay,
  formatTimeOfDayLabel,
  isBookingOutsideBusinessHours,
  isComplianceCheckPrompt,
  isImportServicesFromMenuPrompt,
  isNoShowRecoveryPrompt,
  isPricingAdjustmentPrompt,
  isRevenueForecastPrompt,
  isSickDayReplanPrompt,
  isStaffServiceMatrixPrompt,
  mapOperationsOrchestrationResult,
  mergeServiceIds,
  parseBusinessHoursWindow,
  parseMenuTextToServices,
  parsePriceAdjustment,
  parseSickEmployeeName,
  parseTimeOfDayWindow,
  removeServiceIds,
  rescueOperationsIntent,
  resolveEmployeesBySeniority,
  resolveServicesByCategoryHint,
  shouldAutoExecuteOperations,
  slotOverlapsTimeWindow,
  timeToMinutes,
} from './ai-operations.util.js';

describe('ai-operations.util', () => {
  it('detects operations prompt patterns', () => {
    expect(
      isNoShowRecoveryPrompt(
        'Mark no-shows today, release slots, suggest rebooking',
      ),
    ).toBe(true);
    expect(isNoShowRecoveryPrompt('Mark no-shows today')).toBe(false);
    expect(
      isSickDayReplanPrompt(
        'Maria is sick — cancel her day and redistribute urgent bookings',
      ),
    ).toBe(true);
    expect(isSickDayReplanPrompt("can't work today")).toBe(false);
    expect(
      isImportServicesFromMenuPrompt('Import services from the menu photo'),
    ).toBe(true);
    expect(isImportServicesFromMenuPrompt('scan the menu')).toBe(true);
    expect(
      isPricingAdjustmentPrompt('Raise all massage prices 10% from June 1'),
    ).toBe(true);
    expect(
      isStaffServiceMatrixPrompt(
        'Assign all color services to senior stylists only',
      ),
    ).toBe(true);
    expect(
      isStaffServiceMatrixPrompt(
        'Assign all services from Color category to Gevorg Gasparyan',
      ),
    ).toBe(false);
    expect(
      isComplianceCheckPrompt(
        'Any appointments outside business hours this month?',
      ),
    ).toBe(true);
    expect(isComplianceCheckPrompt('compliance check on hours')).toBe(true);
    expect(
      isRevenueForecastPrompt('Project next week revenue from schedule'),
    ).toBe(true);
    expect(isRevenueForecastPrompt('revenue forecast next week')).toBe(true);
  });

  it('enriches and filters payment sweep params', () => {
    const params = enrichPaymentSweepParams(
      'Mark all completed today as paid except walk-ins',
      {},
    );
    expect(params.excludeWalkIns).toBe(true);
    expect(params.statusFilter).toBe(BookingStatus.COMPLETED);

    const walkInOnly = enrichPaymentSweepParams('no walk-ins in sweep', {});
    expect(walkInOnly.excludeWalkIns).toBe(true);

    const bookings = [
      { customerId: null, status: BookingStatus.COMPLETED },
      { customerId: 'c1', status: BookingStatus.COMPLETED },
      { customerId: 'c2', status: BookingStatus.CONFIRMED },
    ];
    const filtered = filterBookingsForPaymentSweep(bookings, params);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].customerId).toBe('c1');
    expect(filterBookingsForPaymentSweep(bookings, {})).toHaveLength(3);
  });

  it('parses menu text and extracts menu params', () => {
    const services = parseMenuTextToServices(
      'Facial 60min $50\nHaircut - 30 min - 25\nbad line',
    );
    expect(services).toEqual([
      { serviceName: 'Facial', durationMinutes: 60, price: 50 },
      { serviceName: 'Haircut', durationMinutes: 30, price: 25 },
    ]);
    expect(
      extractMenuTextFromParams('add "Facial 60min $50"', { menuText: 'x' }),
    ).toBe('x');
    expect(
      extractMenuTextFromParams('add "Facial 60min $50"', { ocrText: 'y' }),
    ).toBe('y');
    expect(extractMenuTextFromParams('add "Facial 60min $50"', {})).toBe(
      'Facial 60min $50',
    );
    expect(extractMenuTextFromParams('short', {})).toBeNull();
  });

  it('parses price adjustments', () => {
    const adj = parsePriceAdjustment('Raise all massage prices 10%', {});
    expect(adj?.percentChange).toBe(10);
    expect(adj?.categoryHint).toBe('massage');
    expect(applyPriceAdjustment(100, 10)).toBe(110);

    const lower = parsePriceAdjustment('Lower massage prices 5%', {});
    expect(lower?.percentChange).toBe(-5);

    const withParams = parsePriceAdjustment('adjust', {
      percentChange: 15,
      categoryName: 'Spa',
      serviceName: 'Facial',
      effectiveFrom: '2026-06-01',
    });
    expect(withParams?.percentChange).toBe(15);
    expect(withParams?.categoryHint).toBe('Spa');
    expect(withParams?.serviceNameHint).toBe('Facial');
    expect(parsePriceAdjustment('no percent', {})).toBeNull();
  });

  it('e2e-bug.164 — parses absolute dollar deltas and never treats them as percent', () => {
    const dollars = parsePriceAdjustment(
      'Increase the price of the QA Approve Test service by 5 dollars',
      // Classifier wrongly fills percentChange for a dollar prompt.
      { percentChange: 5, serviceName: 'QA Approve Test' },
    );
    expect(dollars).toEqual(
      expect.objectContaining({
        amountChange: 5,
        serviceNameHint: 'QA Approve Test',
      }),
    );
    expect(dollars?.percentChange).toBeUndefined();
    expect(applyPriceAdjustment(20, dollars!)).toBe(25);
    expect(applyPriceAdjustment(20, { percentChange: 5 })).toBe(21);

    const lowered = parsePriceAdjustment(
      'Lower Neck Massage by $10',
      { serviceName: 'Neck Massage' },
    );
    expect(lowered?.amountChange).toBe(-10);
    expect(applyPriceAdjustment(50, lowered!)).toBe(40);

    expect(
      parsePriceAdjustment(
        'Increase the price of the QA Repro Bug164 service by 10 dollars',
        { percentChange: 10 },
      )?.amountChange,
    ).toBe(10);
  });

  it('resolves seniority and category service filters', () => {
    const employees = [
      { id: '1', name: 'Senior Anna', metadata: { seniority: 'senior' } },
      { id: '2', name: 'Junior Bob', metadata: { level: 'junior' } },
      { id: '3', name: 'Chris', metadata: {} },
    ];
    expect(
      resolveEmployeesBySeniority(employees, 'senior').map((e) => e.id),
    ).toEqual(['1']);
    expect(
      resolveEmployeesBySeniority(employees, 'junior').map((e) => e.id),
    ).toEqual(['2']);
    expect(
      resolveEmployeesBySeniority(
        [{ id: '3', name: 'Chris', metadata: {} }],
        'senior',
      )[0].id,
    ).toBe('3');

    const services = [
      { id: 's1', name: 'Full Color', category: { name: 'Color' } },
      { id: 's2', name: 'Haircut', category: { name: 'Cuts' } },
    ];
    expect(
      resolveServicesByCategoryHint(services, 'color').map((s) => s.id),
    ).toEqual(['s1']);
    expect(resolveServicesByCategoryHint(services, 'unknown')[0].id).toBe('s1');
    expect(
      resolveServicesByCategoryHint(services, '').map((s) => s.id),
    ).toEqual(['s1', 's2']);
    expect(mergeServiceIds(['a'], ['b', 'a'])).toEqual(['a', 'b']);
    expect(removeServiceIds(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });

  it('parses business hours and detects violations', () => {
    expect(parseBusinessHoursWindow({ hours: '09:00–19:00' }).openMinutes).toBe(
      9 * 60,
    );
    expect(
      parseBusinessHoursWindow({
        businessHours: { open: '08:30', close: '20:00' },
      }).closeMinutes,
    ).toBe(20 * 60);
    expect(parseBusinessHoursWindow(undefined).openMinutes).toBe(9 * 60);

    const window = parseBusinessHoursWindow({ hours: '09:00–19:00' });
    const insideStart = new Date('2026-06-02T10:00:00.000Z');
    const insideEnd = new Date('2026-06-02T11:00:00.000Z');
    expect(isBookingOutsideBusinessHours(insideStart, insideEnd, window)).toBe(
      false,
    );

    const early = new Date('2026-06-02T07:00:00.000Z');
    const earlyEnd = new Date('2026-06-02T08:00:00.000Z');
    expect(isBookingOutsideBusinessHours(early, earlyEnd, window)).toBe(true);

    const lateEnd = new Date('2026-06-02T20:00:00.000Z');
    expect(isBookingOutsideBusinessHours(insideStart, lateEnd, window)).toBe(
      true,
    );
  });

  it('computes revenue forecast and time-of-day windows', () => {
    const forecast = computeRevenueForecast(
      [{ price: 100 }, { price: 50 }],
      10,
    );
    expect(forecast.grossRevenue).toBe(150);
    expect(forecast.expectedRevenue).toBe(135);

    const capped = computeRevenueForecast([], 150);
    expect(capped.noShowRatePercent).toBe(100);
    expect(capped.expectedRevenue).toBe(0);

    expect(parseTimeOfDayWindow('evening availability', {})).toBe('evening');
    expect(parseTimeOfDayWindow('morning slots', {})).toBe('morning');
    expect(parseTimeOfDayWindow('afternoon slots', {})).toBe('afternoon');
    expect(parseTimeOfDayWindow('', { timeOfDay: 'morning' })).toBe('morning');
    expect(parseTimeOfDayWindow('', { dayPart: 'Afternoon' })).toBe(
      'afternoon',
    );
    expect(parseTimeOfDayWindow('no window', {})).toBeNull();
    expect(formatTimeOfDayLabel('morning')).toContain('12:00');
    expect(formatTimeOfDayLabel('evening')).toContain('17:00');

    expect(timeToMinutes('10:30')).toBe(630);
    expect(slotOverlapsTimeWindow('18:00', '19:00', 'evening')).toBe(true);
    expect(slotOverlapsTimeWindow('09:00', '10:00', 'evening')).toBe(false);
    expect(slotOverlapsTimeWindow('11:00', undefined, 'morning')).toBe(true);
    const slots = filterSlotsByTimeOfDay(
      [
        { start: '09:00', end: '10:00' },
        { start: '18:00', end: '19:00' },
      ],
      'evening',
    );
    expect(slots).toHaveLength(1);
  });

  it('parses sick employee name', () => {
    expect(parseSickEmployeeName('Maria is sick today', {})).toBe('Maria');
    expect(parseSickEmployeeName('Anna called in sick', {})).toBe('Anna');
    expect(parseSickEmployeeName('cancel day', { employeeName: 'Anna' })).toBe(
      'Anna',
    );
  });

  it('rescues operations intents from all branches', () => {
    expect(
      rescueOperationsIntent(
        'Mark no-shows today, release slots',
        'unknown',
        {},
      )?.action,
    ).toBe('no_show_recovery');
    expect(
      rescueOperationsIntent('Maria is sick cancel her day', 'unknown', {})
        ?.action,
    ).toBe('sick_day_replan');
    expect(
      rescueOperationsIntent('Import from menu photo', 'unknown', {})?.action,
    ).toBe('import_services_from_menu');
    expect(
      rescueOperationsIntent('Raise massage prices 10%', 'unknown', {})?.action,
    ).toBe('update_service_prices');
    expect(
      rescueOperationsIntent('Assign color to seniors only', 'unknown', {})
        ?.action,
    ).toBe('staff_service_matrix');
    expect(
      rescueOperationsIntent('outside business hours', 'unknown', {})?.action,
    ).toBe('check_schedule_compliance');
    expect(
      rescueOperationsIntent('forecast revenue next week', 'unknown', {})
        ?.action,
    ).toBe('revenue_forecast');
    expect(
      rescueOperationsIntent('Mark no-shows release slots', 'mark_no_shows', {})
        ?.action,
    ).toBe('no_show_recovery');
    expect(
      rescueOperationsIntent('Maria is sick cancel', 'day_replan', {})?.action,
    ).toBe('sick_day_replan');
    expect(
      rescueOperationsIntent('from menu', 'create_services', {})?.action,
    ).toBe('import_services_from_menu');
    expect(
      rescueOperationsIntent('except walk-ins', 'payment_sweep', {})?.params
        .excludeWalkIns,
    ).toBe(true);
    expect(
      rescueOperationsIntent('evening slots', 'check_availability', {})?.params
        .timeOfDay,
    ).toBe('evening');
    expect(
      rescueOperationsIntent('Mark no-shows release slots', 'mark_no_shows', {})
        ?.action,
    ).toBe('no_show_recovery');
    expect(
      rescueOperationsIntent('no_show_recovery', 'no_show_recovery', {}),
    ).toBeNull();
    expect(
      rescueOperationsIntent('Maria is sick cancel her day', 'day_replan', {})
        ?.action,
    ).toBe('sick_day_replan');
    expect(
      rescueOperationsIntent('import from menu', 'create_services', {})?.action,
    ).toBe('import_services_from_menu');
    expect(
      rescueOperationsIntent('Alex is sick cancel day', 'unknown', {})?.params
        .employeeName,
    ).toBe('Alex');
    expect(
      rescueOperationsIntent('slots today', 'check_availability', {}),
    ).toBeNull();
    expect(
      rescueOperationsIntent('someone is sick cancel day', 'unknown', {})
        ?.action,
    ).toBe('sick_day_replan');
    expect(
      rescueOperationsIntent('list bookings', 'list_bookings', {}),
    ).toBeNull();
    expect(
      rescueOperationsIntent('swap schedules', 'swap_schedules', {}),
    ).toBeNull();
  });

  it('covers seniority title and business hours object branches', () => {
    const seniors = resolveEmployeesBySeniority(
      [{ id: '1', name: 'Pat', metadata: { title: 'Senior Stylist' } }],
      'senior',
    );
    expect(seniors[0].id).toBe('1');

    const hours = parseBusinessHoursWindow({
      businessHours: { start: '08:00', end: '18:00' },
    });
    expect(hours.closeMinutes).toBe(18 * 60);
    expect(parseBusinessHoursWindow({ hours: 'bad' }).openMinutes).toBe(9 * 60);
  });

  it('covers remaining util branches', () => {
    expect(isSickDayReplanPrompt("can't work — cancel today")).toBe(true);
    expect(isPricingAdjustmentPrompt('15% price change')).toBe(true);
    expect(isStaffServiceMatrixPrompt('assign junior stylists only')).toBe(
      true,
    );
    expect(isComplianceCheckPrompt('appointments outside hours')).toBe(true);
    expect(isImportServicesFromMenuPrompt('add from the menu')).toBe(true);

    expect(
      enrichPaymentSweepParams('walk-ins except in sweep', {}).excludeWalkIns,
    ).toBe(true);
    expect(
      enrichPaymentSweepParams('completed and in-progress today', {})
        .statusFilter,
    ).toBeUndefined();

    expect(parseMenuTextToServices('   ')).toEqual([]);
    expect(parseMenuTextToServices('!!! 0min $0')).toEqual([]);
    expect(parseMenuTextToServices('Facial abc min $50')).toEqual([]);
    expect(parseMenuTextToServices('Facial 60min $xx')).toEqual([]);
    expect(parseMenuTextToServices('  60min $50')).toEqual([]);

    const fromCategory = parsePriceAdjustment('adjust', {
      percentChange: 5,
      serviceCategory: 'Spa',
    });
    expect(fromCategory?.categoryHint).toBe('Spa');
    const fromDate = parsePriceAdjustment('adjust', {
      percentChange: 5,
      date: '2026-06-01',
    });
    expect(fromDate?.effectiveFrom).toBe('2026-06-01');
    const fromServicesPrice = parsePriceAdjustment(
      'massage services price 8%',
      {},
    );
    expect(fromServicesPrice?.categoryHint).toBe('massage');
    const fromPromptDate = parsePriceAdjustment('raise 5% from 2026-07-01', {});
    expect(fromPromptDate?.effectiveFrom).toBe('2026-07-01');

    expect(mergeServiceIds(undefined, ['a'])).toEqual(['a']);
    expect(removeServiceIds(undefined, ['a'])).toEqual([]);

    expect(
      parseBusinessHoursWindow({ businessHours: { end: '18:00' } })
        .closeMinutes,
    ).toBe(18 * 60);
    expect(
      parseBusinessHoursWindow({ businessHours: { open: '08:00' } })
        .openMinutes,
    ).toBe(8 * 60);
    expect(parseBusinessHoursWindow({ hours: '09.00-19.00' }).openMinutes).toBe(
      9 * 60,
    );
    expect(
      parseBusinessHoursWindow({ hours: 'bad:bad-bad:bad' }).openMinutes,
    ).toBe(9 * 60);
    expect(parseBusinessHoursWindow({ hours: '09:00' }).openMinutes).toBe(
      9 * 60,
    );
    expect(parseBusinessHoursWindow({ hours: '09:xx-19:00' }).openMinutes).toBe(
      9 * 60,
    );
    expect(parseBusinessHoursWindow({ hours: 'xx:00-19:00' }).openMinutes).toBe(
      9 * 60,
    );
    expect(parseBusinessHoursWindow({ hours: '9-19' }).openMinutes).toBe(
      9 * 60,
    );
    expect(parseBusinessHoursWindow({ hours: '9-19' }).closeMinutes).toBe(
      19 * 60,
    );
    expect(
      parseBusinessHoursWindow({ businessHours: { open: '8', close: '20' } })
        .openMinutes,
    ).toBe(8 * 60);

    expect(parseTimeOfDayWindow('', { dayPart: 'night' })).toBeNull();
    expect(formatTimeOfDayLabel('afternoon')).toContain('17:00');
    expect(timeToMinutes('10')).toBe(600);

    expect(
      resolveEmployeesBySeniority(
        [{ id: '1', name: 'Junior Pat', metadata: {} }],
        'junior',
      )[0].name,
    ).toBe('Junior Pat');
    expect(
      resolveEmployeesBySeniority(
        [{ id: '1', name: 'Senior Pat', metadata: {} }],
        'senior',
      )[0].name,
    ).toBe('Senior Pat');

    expect(
      rescueOperationsIntent('is sick cancel day', 'unknown', {})?.params
        .employeeName,
    ).toBeUndefined();
    expect(
      mapOperationsOrchestrationResult({
        success: false,
        action: 'x',
        summary: 'nope',
      }).details,
    ).toEqual({});
  });

  it('maps orchestration results and auto-execute rules', () => {
    const mapped = mapOperationsOrchestrationResult({
      success: true,
      action: 'no_show_recovery',
      summary: 'ok',
      taskId: 't1',
      requiresApproval: true,
    });
    expect(mapped.details.taskId).toBe('t1');
    expect(shouldAutoExecuteOperations('no_show_recovery', 4)).toBe(false);
    expect(shouldAutoExecuteOperations('sick_day_replan', 6)).toBe(false);
    expect(shouldAutoExecuteOperations('import_services_from_menu', 3)).toBe(
      false,
    );
    expect(shouldAutoExecuteOperations('update_service_prices', 2)).toBe(true);
    expect(shouldAutoExecuteOperations('update_service_prices', 10)).toBe(
      false,
    );
    expect(shouldAutoExecuteOperations('check_schedule_compliance', 1)).toBe(
      false,
    );
  });
});
