import {
  buildPayoutExportRows,
  calculateCommissionAmount,
  payoutExportRowsToCsv,
  pickCommissionRule,
} from './commission-payout.util.js';

describe('commission-payout.util', () => {
  const rules = [
    { id: 'r1', employeeId: 'e1', serviceId: 's1', type: 'percent', value: 10, isActive: true },
    { id: 'r2', employeeId: 'e1', serviceId: null, type: 'flat', value: 5, isActive: true },
    { id: 'r3', employeeId: null, serviceId: null, type: 'percent', value: 3, isActive: true },
  ] as any[];

  it('picks most specific commission rule', () => {
    expect(pickCommissionRule(rules, 'e1', 's1')?.id).toBe('r1');
    expect(pickCommissionRule(rules, 'e1', 's9')?.id).toBe('r2');
    expect(pickCommissionRule(rules, 'e9', 's9')?.id).toBe('r3');
  });

  it('calculates percent and flat commissions', () => {
    expect(calculateCommissionAmount(100, { type: 'percent', value: 10 })).toBe(10);
    expect(calculateCommissionAmount(100, { type: 'flat', value: 15 })).toBe(15);
  });

  it('skips bookings without service or matching rule', () => {
    expect(
      buildPayoutExportRows(
        [{ id: 'b1', employeeId: 'e1', serviceId: 's1', startTime: new Date(), service: null }],
        rules,
      ),
    ).toEqual([]);
    expect(
      buildPayoutExportRows(
        [
          {
            id: 'b2',
            employeeId: 'e9',
            serviceId: 's9',
            startTime: new Date(),
            service: { name: 'Cut', price: 20 },
          },
        ],
        [],
      ),
    ).toEqual([]);
  });

  it('builds payout rows for completed paid bookings', () => {
    const rows = buildPayoutExportRows(
      [
        {
          id: 'b1',
          employeeId: 'e1',
          serviceId: 's1',
          startTime: new Date('2026-05-01T10:00:00Z'),
          service: { name: 'Cut', price: 50 },
          employee: { name: 'Alex' },
        },
      ],
      rules,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].commissionAmount).toBe(5);
    expect(rows[0].employeeName).toBe('Alex');
  });

  it('serializes payout rows to CSV', () => {
    const csv = payoutExportRowsToCsv([
      {
        employeeId: 'e1',
        employeeName: 'Alex',
        bookingId: 'b1',
        appointmentDate: '2026-05-01',
        serviceName: 'Cut',
        bookingAmount: 50,
        ruleType: 'percent',
        ruleValue: 10,
        commissionAmount: 5,
      },
    ]);
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('Alex');
    expect(csv).toContain('5.00');
  });

  it('escapes CSV values with commas and quotes', () => {
    const csv = payoutExportRowsToCsv([
      {
        employeeId: 'e1',
        employeeName: 'Alex "Pro", LLC',
        bookingId: 'b1',
        appointmentDate: '2026-05-01',
        serviceName: 'Cut, color',
        bookingAmount: 50,
        ruleType: 'percent',
        ruleValue: 10,
        commissionAmount: 5,
      },
    ]);
    expect(csv).toContain('"Alex ""Pro"", LLC"');
    expect(csv).toContain('"Cut, color"');
  });
});
