import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  buildMissingOnlinePaymentAuditSummary,
  handleAuditServicesMissingOnlinePaymentLogic,
} from './ai-audit-services-missing-online-payment.logic.js';

describe('ai-audit-services-missing-online-payment.logic', () => {
  describe('buildMissingOnlinePaymentAuditSummary', () => {
    it('lists missing services with stripe hint', () => {
      const summary = buildMissingOnlinePaymentAuditSummary({
        missing: [
          { id: 's1', name: 'Haircut' },
          { id: 's2', name: 'Facial' },
        ],
        totalActiveInScope: 5,
        stripeConnected: true,
      });
      expect(summary).toContain('2 of 5');
      expect(summary).toContain('Haircut');
      expect(summary).toContain('configure_service_online_payment');
    });

    it('reports all services enabled', () => {
      const summary = buildMissingOnlinePaymentAuditSummary({
        missing: [],
        totalActiveInScope: 3,
        stripeConnected: false,
      });
      expect(summary).toContain('All 3 active service(s)');
    });
  });

  describe('handleAuditServicesMissingOnlinePaymentLogic', () => {
    const businessRepo = {
      findOne: jest.fn(async () => ({ id: 'biz-1', settings: {} })),
    };
    const serviceRepo = {
      find: jest.fn(async () => [
        {
          id: 's1',
          name: 'Haircut',
          prepaymentMode: PrepaymentMode.NONE,
          isActive: true,
          category: { name: 'Hair' },
        },
        {
          id: 's2',
          name: 'Massage',
          prepaymentMode: PrepaymentMode.FULL,
          isActive: true,
          category: { name: 'Body' },
        },
      ]),
    };

    it('returns gap audit for valid prompt', async () => {
      const result = await handleAuditServicesMissingOnlinePaymentLogic(
        { businessRepo: businessRepo as any, serviceRepo: serviceRepo as any },
        'biz-1',
        {},
        "Which services still don't accept online payment?",
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('audit_services_missing_online_payment');
      expect(result.summary).toContain('Haircut');
      expect((result.details as any).missingOnlinePaymentCount).toBe(1);
    });

    it('fails for unrelated prompt', async () => {
      const result = await handleAuditServicesMissingOnlinePaymentLogic(
        { businessRepo: businessRepo as any, serviceRepo: serviceRepo as any },
        'biz-1',
        {},
        'Explain service online payment setup',
      );
      expect(result.success).toBe(false);
    });
  });
});
