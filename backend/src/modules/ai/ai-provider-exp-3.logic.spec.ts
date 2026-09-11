import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  dispatchProviderExp3Intent,
  handleAddRetailToBookingLogic,
  handleRemoveRetailFromBookingLogic,
  handleBlockMyTimeLogic,
  handleExtendMyBlockLogic,
  handleSendClientMessageLogic,
  handleExplainMessageTemplatesLogic,
  handleNotifyClientReadyLogic,
} from './ai-provider-exp-3.logic.js';

describe('ai-provider-exp-3.logic (prov-exp-5.3)', () => {
  const bookingRepo = {
    find: jest.fn(),
  };
  const businessService = {
    findOne: jest.fn(),
  };
  const providerMobile = {
    getBookingDetail: jest.fn(),
    resolveMobileAccess: jest.fn(),
    getScopedEmployeeId: jest.fn(),
    createProviderSelfBlock: jest.fn(),
    extendProviderSelfBlock: jest.fn(),
  };
  const retailFinance = {
    handleAddRetailToMyBooking: jest.fn(),
    handleRemoveRetailFromMyBooking: jest.fn(),
  };
  const providerTimeOff = {
    handleIntent: jest.fn(),
  };
  const notificationsService = {
    getProviderStatus: jest.fn().mockReturnValue({
      whatsappConfigured: true,
    }),
  };

  const deps = {
    bookingRepo: bookingRepo as any,
    businessService: businessService as any,
    providerMobile: providerMobile as any,
    retailFinance: retailFinance as any,
    providerTimeOff: providerTimeOff as any,
    notificationsService: notificationsService as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Studio',
      settings: {
        staffMessageTemplates: { enabled: true, templates: [] },
        notifications: { whatsappEnabled: true },
      },
    });
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'provider',
      employee: { id: 'emp-1' },
    });
    providerMobile.getScopedEmployeeId.mockReturnValue('emp-1');
  });

  it('builds SMS link for send_client_message with bookingId', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });

    const result = await handleSendClientMessageLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b-1' },
      'Text Jane running late',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('send_client_message');
    expect(result.details.openLink).toContain('sms:');
  });

  it('blocks own calendar time via block_my_time', async () => {
    providerMobile.createProviderSelfBlock.mockResolvedValue({
      id: 'block-1',
      startTime: '2026-06-09T12:00:00.000Z',
      endTime: '2026-06-09T13:00:00.000Z',
    });

    const result = await handleBlockMyTimeLogic(
      deps,
      'biz-1',
      'user-1',
      { date: '2026-06-09' },
      'Block my lunch 12:00 to 13:00 today',
    );

    expect(providerMobile.createProviderSelfBlock).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      expect.objectContaining({
        startTime: '12:00',
        endTime: '13:00',
        placeholder: 'Lunch',
      }),
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('block_my_time');
  });

  it('extends the provider own most-recent block (ai-cmd-provider-5.6.6)', async () => {
    providerMobile.extendProviderSelfBlock.mockResolvedValue({
      id: 'block-1',
      placeholder: 'Lunch',
      startTime: '2026-06-09T12:00:00.000Z',
      endTime: '2026-06-09T12:30:00.000Z',
      employeeId: 'emp-1',
    });

    const result = await handleExtendMyBlockLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Extend lunch 30 minutes',
    );

    expect(providerMobile.extendProviderSelfBlock).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      { extendMinutes: 30, newEndTime: undefined },
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('extend_my_block');
  });

  it('fails extend_my_block when no block exists to extend', async () => {
    providerMobile.extendProviderSelfBlock.mockRejectedValue(
      new Error(
        'No block found to extend. Create one first with "block my lunch".',
      ),
    );

    const result = await handleExtendMyBlockLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Extend lunch 30 minutes',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('extend_my_block');
  });

  it('requires customer when send_client_message has no bookingId', async () => {
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-2',
        startTime: new Date('2026-06-09T15:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Sam', phone: '+15557654321' },
      },
    ]);

    const result = await handleSendClientMessageLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Sam' },
      'SMS Sam running late',
    );

    expect(result.success).toBe(true);
    expect(result.details.customerName).toBe('Sam');
  });

  it('fails send_client_message when templates disabled', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Studio',
      settings: { staffMessageTemplates: { enabled: false, templates: [] } },
    });
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });

    const result = await handleSendClientMessageLogic(deps, 'biz-1', 'user-1', {
      bookingId: 'b-1',
    });

    expect(result.success).toBe(false);
  });

  it('explains message templates for a booking (ai-cmd-provider-5.5.4)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
      staffMessageTemplates: [
        {
          id: 'running-late',
          label: 'Running late',
          body: "Hi Jane, I'm running late.",
        },
      ],
    });

    const result = await handleExplainMessageTemplatesLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b-1' },
      'What templates can I send?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_message_templates');
    expect(result.summary).toContain('Running late');
    expect(result.details.templates).toHaveLength(1);
  });

  it('reports no templates enabled when explaining message templates', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
      staffMessageTemplates: null,
    });

    const result = await handleExplainMessageTemplatesLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b-1' },
      'What templates can I send?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No canned message templates');
  });

  it('notifies client ready with a default message when no ready template is configured (ai-cmd-provider-5.5.5)', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });

    const result = await handleNotifyClientReadyLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b-1' },
      'Tell her chair is ready',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('notify_client_ready');
    expect(result.details.messageBody).toContain("we're ready for you now");
    expect(result.details.openLink).toContain('sms:');
  });

  it('notifies client ready using a configured ready template when one exists', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Studio',
      settings: {
        staffMessageTemplates: {
          enabled: true,
          templates: [
            {
              id: 'your-turn',
              label: 'Your turn',
              body: 'Hi {customerName}, your turn is now — come on in!',
              enabled: true,
            },
          ],
        },
        notifications: { whatsappEnabled: true },
      },
    });
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });

    const result = await handleNotifyClientReadyLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b-1' },
      'Tell her chair is ready',
    );

    expect(result.success).toBe(true);
    expect(result.details.templateId).toBe('your-turn');
    expect(result.details.messageBody).toContain('your turn is now');
  });

  it('fails block_my_time when window missing', async () => {
    const result = await handleBlockMyTimeLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'block something vague',
    );

    expect(result.success).toBe(false);
    expect(result.action).toBe('block_my_time');
  });

  it('delegates add_retail_to_booking to retail finance', async () => {
    retailFinance.handleAddRetailToMyBooking.mockResolvedValue({
      success: true,
      action: 'add_retail_to_my_booking',
      summary: 'Added shampoo',
      details: { bookingId: 'b-1' },
    });

    const result = await handleAddRetailToBookingLogic(
      deps,
      'biz-1',
      'user-1',
      'emp-1',
      { bookingId: 'b-1', productName: 'Shampoo' },
      'Add shampoo to booking',
    );

    expect(result.action).toBe('add_retail_to_booking');
    expect(result.success).toBe(true);
  });

  it('delegates remove_retail_from_booking to retail finance (ai-cmd-provider-5.4.4)', async () => {
    retailFinance.handleRemoveRetailFromMyBooking.mockResolvedValue({
      success: true,
      action: 'remove_retail_line',
      summary: 'Removed retail line — 0 line(s) remain.',
      details: { bookingId: 'b-1' },
    });

    const result = await handleRemoveRetailFromBookingLogic(
      deps,
      'biz-1',
      'user-1',
      'emp-1',
      { bookingId: 'b-1', productName: 'Shampoo' },
      'Remove shampoo from this booking',
    );

    expect(result.action).toBe('remove_retail_from_booking');
    expect(result.success).toBe(true);
    expect(retailFinance.handleRemoveRetailFromMyBooking).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ bookingId: 'b-1', productName: 'Shampoo' }),
      'user-1',
      'Remove shampoo from this booking',
    );
  });

  it('dispatches request_time_off through time-off service', async () => {
    providerTimeOff.handleIntent.mockResolvedValue({
      success: true,
      action: 'request_time_off',
      summary: 'Submitted',
      details: {},
    });

    const result = await dispatchProviderExp3Intent(
      deps,
      'biz-1',
      'user-1',
      'request_time_off',
      { startDate: '2026-06-10', endDate: '2026-06-10' },
      undefined,
      undefined,
      'emp-1',
    );

    expect(result?.success).toBe(true);
    expect(providerTimeOff.handleIntent).toHaveBeenCalled();
  });

  it('returns null for unknown exp-3 action', async () => {
    const result = await dispatchProviderExp3Intent(
      deps,
      'biz-1',
      'user-1',
      'unknown_action',
      {},
    );
    expect(result).toBeNull();
  });

  it('dispatches send_client_message and block_my_time branches', async () => {
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });
    providerMobile.createProviderSelfBlock.mockResolvedValue({ id: 'block-1' });

    const messageResult = await dispatchProviderExp3Intent(
      deps,
      'biz-1',
      'user-1',
      'send_client_message',
      { bookingId: 'b-1' },
      'WhatsApp Jane running late',
    );
    expect(messageResult?.action).toBe('send_client_message');

    const blockResult = await dispatchProviderExp3Intent(
      deps,
      'biz-1',
      'user-1',
      'block_my_time',
      { date: '2026-06-09' },
      'Block my break 15:00 to 15:15',
    );
    expect(blockResult?.action).toBe('block_my_time');
  });

  it('handles missing booking and missing phone paths', async () => {
    providerMobile.getBookingDetail.mockRejectedValue(new Error('missing'));
    const missingBooking = await handleSendClientMessageLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'missing' },
    );
    expect(missingBooking.success).toBe(false);

    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: null },
    });
    const noPhone = await handleSendClientMessageLogic(
      deps,
      'biz-1',
      'user-1',
      { bookingId: 'b-1' },
    );
    expect(noPhone.success).toBe(false);

    const noCustomer = await handleSendClientMessageLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'send message',
    );
    expect(noCustomer.success).toBe(false);
  });

  it('rejects whatsapp when not configured', async () => {
    notificationsService.getProviderStatus.mockReturnValue({
      whatsappConfigured: false,
    });
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });

    const result = await handleSendClientMessageLogic(deps, 'biz-1', 'user-1', {
      bookingId: 'b-1',
      channel: 'whatsapp',
    });

    expect(result.success).toBe(false);
  });

  it('fails when no booking matches customer name', async () => {
    bookingRepo.find.mockResolvedValue([]);

    const result = await handleSendClientMessageLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Missing' },
      'Text Missing',
    );

    expect(result.success).toBe(false);
  });

  it('matches template by label and dispatches add retail', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Studio',
      settings: {
        staffMessageTemplates: {
          enabled: true,
          templates: [
            {
              id: 'custom-late',
              label: 'Running late custom',
              body: 'Hi {customerName}',
              enabled: true,
            },
          ],
        },
        notifications: { whatsappEnabled: true },
      },
    });
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });

    const result = await handleSendClientMessageLogic(deps, 'biz-1', 'user-1', {
      bookingId: 'b-1',
      templateLabel: 'Running late custom',
    });

    expect(result.success).toBe(true);
    expect(result.details.templateId).toBe('custom-late');

    retailFinance.handleAddRetailToMyBooking.mockResolvedValue({
      success: true,
      action: 'add_retail_to_my_booking',
      summary: 'ok',
      details: {},
    });
    const retail = await dispatchProviderExp3Intent(
      deps,
      'biz-1',
      'user-1',
      'add_retail_to_booking',
      { bookingId: 'b-1' },
      undefined,
      undefined,
      'emp-1',
    );
    expect(retail?.action).toBe('add_retail_to_booking');
  });

  it('fails when templates feature disabled with only disabled entries', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      name: 'Studio',
      settings: {
        staffMessageTemplates: {
          enabled: false,
          templates: [
            {
              id: 'off',
              label: 'Off',
              body: 'Hi',
              enabled: false,
            },
          ],
        },
      },
    });
    providerMobile.getBookingDetail.mockResolvedValue({
      startTime: '2026-06-09T14:00:00.000Z',
      customer: { name: 'Jane', phone: '+15551234567' },
    });

    const result = await handleSendClientMessageLogic(deps, 'biz-1', 'user-1', {
      bookingId: 'b-1',
    });

    expect(result.success).toBe(false);
  });

  it('uses break preset when blocking my break', async () => {
    providerMobile.createProviderSelfBlock.mockResolvedValue({ id: 'block-2' });

    const result = await handleBlockMyTimeLogic(
      deps,
      'biz-1',
      'user-1',
      { date: '2026-06-09' },
      'Block my break today',
    );

    expect(result.success).toBe(true);
    expect(providerMobile.createProviderSelfBlock).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
      expect.objectContaining({ placeholder: 'Break' }),
    );
  });

  it('returns time-off failure when service returns null', async () => {
    providerTimeOff.handleIntent.mockResolvedValue(null);

    const result = await dispatchProviderExp3Intent(
      deps,
      'biz-1',
      'user-1',
      'request_time_off',
      { startDate: '2026-06-10', endDate: '2026-06-10' },
      undefined,
      undefined,
      'emp-1',
    );

    expect(result?.success).toBe(false);
  });
});
