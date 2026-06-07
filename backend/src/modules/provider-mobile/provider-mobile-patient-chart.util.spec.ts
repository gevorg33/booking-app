import {
  buildProviderPatientChartTodayWindow,
  customerIdsAssignedToProvider,
  mapProviderPatientChartOrder,
  mapProviderPatientChartResult,
} from './provider-mobile-patient-chart.util.js';

describe('provider-mobile-patient-chart.util', () => {
  it('builds a UTC day window for today chart filters', () => {
    const window = buildProviderPatientChartTodayWindow(
      new Date('2026-06-07T15:30:00.000Z'),
    );

    expect(window).toEqual({
      date: '2026-06-07',
      from: '2026-06-07T00:00:00.000Z',
      to: '2026-06-07T23:59:59.999Z',
    });
  });

  it('maps lab queue items into provider chart order views', () => {
    expect(
      mapProviderPatientChartOrder({
        id: 'order-1',
        status: 'NotCollected',
        displayNames: null,
        department: null,
        bookingId: null,
        customerName: null,
        bookingStartTime: null,
        employeeName: null,
        createdAt: new Date('2026-06-07T09:00:00.000Z'),
      }),
    ).toEqual({
      id: 'order-1',
      status: 'NotCollected',
      displayNames: null,
      department: null,
      bookingId: null,
      bookingStartTime: null,
      employeeName: null,
    });

    expect(
      mapProviderPatientChartOrder({
        id: 'order-1',
        status: 'NotCollected',
        displayNames: 'CBC',
        department: 'Hematology',
        bookingId: 'booking-1',
        customerName: 'Jane Doe',
        bookingStartTime: '2026-06-07T10:00:00.000Z',
        employeeName: 'Dr Smith',
        createdAt: new Date('2026-06-07T09:00:00.000Z'),
      }),
    ).toEqual({
      id: 'order-1',
      status: 'NotCollected',
      displayNames: 'CBC',
      department: 'Hematology',
      bookingId: 'booking-1',
      bookingStartTime: '2026-06-07T10:00:00.000Z',
      employeeName: 'Dr Smith',
    });
  });

  it('maps result queue items into provider chart result views', () => {
    expect(
      mapProviderPatientChartResult({
        id: 'result-2',
        status: 'Released',
        testName: null,
        orderId: null,
        orderStatus: null,
        bookingId: null,
        customerName: null,
        bookingStartTime: null,
        employeeName: null,
        department: null,
        measurementFlag: null,
        completedAt: null,
        reviewedAt: null,
        releasedAt: null,
        createdAt: new Date('2026-06-07T11:00:00.000Z'),
      }),
    ).toEqual({
      id: 'result-2',
      status: 'Released',
      testName: null,
      department: null,
      orderId: null,
      bookingId: null,
      bookingStartTime: null,
      employeeName: null,
      measurementFlag: null,
    });

    expect(
      mapProviderPatientChartResult({
        id: 'result-1',
        status: 'Pending',
        testName: 'CBC',
        orderId: 'order-1',
        orderStatus: 'Collected',
        bookingId: 'booking-1',
        customerName: 'Jane Doe',
        bookingStartTime: '2026-06-07T10:00:00.000Z',
        employeeName: 'Dr Smith',
        department: 'Hematology',
        measurementFlag: 'Normal',
        completedAt: null,
        reviewedAt: null,
        releasedAt: null,
        createdAt: new Date('2026-06-07T11:00:00.000Z'),
      }),
    ).toEqual({
      id: 'result-1',
      status: 'Pending',
      testName: 'CBC',
      department: 'Hematology',
      orderId: 'order-1',
      bookingId: 'booking-1',
      bookingStartTime: '2026-06-07T10:00:00.000Z',
      employeeName: 'Dr Smith',
      measurementFlag: 'Normal',
    });
  });

  it('collects distinct customer ids assigned to a provider', () => {
    expect(customerIdsAssignedToProvider([], 'emp-1')).toEqual([]);

    expect(
      customerIdsAssignedToProvider(
        [
          {
            customerId: 'cust-1',
            employeeId: 'emp-1',
            linkedEmployeeIds: [],
          },
          {
            customerId: 'cust-2',
            employeeId: 'emp-2',
            linkedEmployeeIds: null,
          },
          {
            customerId: 'cust-4',
            employeeId: 'emp-2',
            linkedEmployeeIds: ['emp-1'],
          },
          {
            customerId: 'cust-1',
            employeeId: 'emp-1',
            linkedEmployeeIds: [],
          },
          {
            customerId: 'cust-3',
            employeeId: 'emp-3',
            linkedEmployeeIds: [],
          },
        ],
        'emp-1',
      ),
    ).toEqual(['cust-1', 'cust-4']);
  });
});
