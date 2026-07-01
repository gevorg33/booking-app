import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PublicConsumerSupportService } from './public-consumer-support.service.js';

describe('PublicConsumerSupportService', () => {
  const businessService = {
    findBySlug: jest.fn(),
  };
  const bookingRepo = {
    findOne: jest.fn(),
  };
  const customerRepo = {
    findOne: jest.fn(),
  };
  const zendeskIntegrationService = {
    createSupportTicket: jest.fn(),
  };

  const service = new PublicConsumerSupportService(
    businessService as never,
    bookingRepo as never,
    customerRepo as never,
    zendeskIntegrationService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findBySlug.mockResolvedValue({
      id: 'biz-1',
      name: 'Glow Nails',
    });
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      name: 'Alex',
      email: 'alex@test.com',
      businessId: 'biz-1',
    });
    bookingRepo.findOne.mockResolvedValue({
      id: 'bk-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
    });
    zendeskIntegrationService.createSupportTicket.mockResolvedValue({
      ticketId: 99,
      agentUrl: 'https://example.zendesk.com/agent/tickets/99',
    });
  });

  it('creates a Zendesk ticket for post-booking unhappy feedback', async () => {
    const result = await service.createPostBookingSupportTicket(
      'glow-nails',
      'cust-1',
      {
        bookingId: 'bk-1',
        message: 'Wrong time shown in confirmation',
      },
    );

    expect(result.ticketId).toBe(99);
    expect(zendeskIntegrationService.createSupportTicket).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        bookingId: 'bk-1',
        customerId: 'cust-1',
        subject: 'Post-booking app feedback — Glow Nails',
        tags: ['optischedule', 'consumer-app', 'post-booking-feedback'],
      }),
    );
  });

  it('rejects when booking does not belong to customer', async () => {
    bookingRepo.findOne.mockResolvedValue(null);
    await expect(
      service.createPostBookingSupportTicket('glow-nails', 'cust-1', {
        bookingId: 'bk-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires customer email for Zendesk requester', async () => {
    customerRepo.findOne.mockResolvedValue({
      id: 'cust-1',
      name: 'Alex',
      email: null,
      businessId: 'biz-1',
    });

    await expect(
      service.createPostBookingSupportTicket('glow-nails', 'cust-1', {
        bookingId: 'bk-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
