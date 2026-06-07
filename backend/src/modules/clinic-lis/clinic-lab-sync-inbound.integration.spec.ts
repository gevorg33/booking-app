import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CLINIC_LIS_INBOUND_HL7_PAYLOAD,
  CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD,
  CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
} from '../../common/utils/clinic-lab-sync-inbound.fixtures.js';
import { computeClinicLisInboundWebhookSignature } from '../../common/utils/clinic-lab-sync-inbound-webhook.util.js';
import { ClinicLabSyncInboundQueueService } from './clinic-lab-sync-inbound-queue.service.js';
import { ClinicLabSyncInboundWorkerService } from './clinic-lab-sync-inbound-worker.service.js';

describe('ClinicLabSyncInbound queue + worker (integration)', () => {
  const businessSettings = {
    businessType: 'clinic',
    clinicLis: { inboundWebhookSecret: CLINIC_LIS_INBOUND_WEBHOOK_SECRET },
  };

  let savedMessage: Record<string, unknown> = {
    id: 'msg-1',
    businessId: 'biz-1',
    source: 'vendor_json',
    contentType: 'application/json',
    rawPayload: JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD),
    status: 'Pending',
    integrationVendorCode: null,
    labInfoId: null,
  };

  const messageRepo = {
    find: jest.fn(async () => [savedMessage]),
    findOne: jest.fn(async () => savedMessage as never),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      savedMessage = { ...savedMessage, ...value };
      return savedMessage;
    }),
  };

  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: businessSettings,
    })),
  };

  const eventEmitter = { emit: jest.fn() };
  const observationService = {
    ingestAdaptedObservationRequest: jest.fn(async () => ({
      id: 'obs-req-1',
      businessId: 'biz-1',
      status: 'Unlinked',
      observations: [],
    })),
  };

  const queueService = new ClinicLabSyncInboundQueueService(
    messageRepo as never,
    businessService as never,
    eventEmitter as unknown as EventEmitter2,
  );

  const workerService = new ClinicLabSyncInboundWorkerService(
    messageRepo as never,
    observationService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    savedMessage = {
      id: 'msg-1',
      businessId: 'biz-1',
      source: 'vendor_json',
      contentType: 'application/json',
      rawPayload: JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD),
      status: 'Pending',
      integrationVendorCode: null,
      labInfoId: null,
    };
    messageRepo.findOne.mockImplementation(async (query) => {
      const where = (query as { where?: Record<string, unknown> })?.where;
      if (where?.idempotencyKey) return null;
      return savedMessage as never;
    });
  });

  it('enqueues signed inbound messages and emits worker event', async () => {
    const rawBody = JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD);
    const rawBodyBuffer = Buffer.from(rawBody);
    const signature = computeClinicLisInboundWebhookSignature(
      CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
      rawBodyBuffer,
    );

    const result = await queueService.enqueueInboundMessage({
      businessId: 'biz-1',
      rawBody,
      rawBodyBuffer,
      signature,
      contentType: 'application/json',
      idempotencyKey: 'delivery-1',
    });

    expect(result.data.status).toBe('Pending');
    expect(result.data.duplicate).toBe(false);
    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('returns duplicate delivery ids without re-enqueueing', async () => {
    messageRepo.findOne.mockImplementationOnce(
      async () =>
        ({
          id: 'existing-msg',
          status: 'Completed',
        }) as never,
    );

    const rawBody = JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD);
    const rawBodyBuffer = Buffer.from(rawBody);
    const signature = computeClinicLisInboundWebhookSignature(
      CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
      rawBodyBuffer,
    );

    const result = await queueService.enqueueInboundMessage({
      businessId: 'biz-1',
      rawBody,
      rawBodyBuffer,
      signature,
      contentType: 'application/json',
      idempotencyKey: 'delivery-1',
    });

    expect(result.data.duplicate).toBe(true);
    expect(messageRepo.save).not.toHaveBeenCalled();
  });

  it('rejects invalid signatures', async () => {
    const rawBody = JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD);
    await expect(
      queueService.enqueueInboundMessage({
        businessId: 'biz-1',
        rawBody,
        rawBodyBuffer: Buffer.from(rawBody),
        signature: 'invalid',
        contentType: 'application/json',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects empty bodies', async () => {
    await expect(
      queueService.enqueueInboundMessage({
        businessId: 'biz-1',
        rawBody: '',
        rawBodyBuffer: Buffer.from(''),
        signature: 'invalid',
        contentType: 'application/json',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('processes pending vendor JSON messages into observation requests', async () => {
    const processed = await workerService.processMessage('msg-1');

    expect(processed).toBe(true);
    expect(savedMessage.status).toBe('Completed');
    expect(savedMessage.observationRequestId).toBe('obs-req-1');
    expect(
      observationService.ingestAdaptedObservationRequest,
    ).toHaveBeenCalled();
  });

  it('marks HL7 messages failed when parsing breaks', async () => {
    savedMessage = {
      ...savedMessage,
      source: 'hl7',
      rawPayload: 'MSH|^~\\&|LIS|LAB',
    };

    await workerService.processMessage('msg-1');

    expect(savedMessage.status).toBe('Failed');
    expect(
      observationService.ingestAdaptedObservationRequest,
    ).not.toHaveBeenCalled();
  });

  it('rejects enqueue when webhook secret is missing', async () => {
    businessService.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    } as never);

    const rawBody = JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD);
    await expect(
      queueService.enqueueInboundMessage({
        businessId: 'biz-1',
        rawBody,
        rawBodyBuffer: Buffer.from(rawBody),
        signature: 'sig',
        contentType: 'application/json',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects enqueue when source cannot be resolved', async () => {
    const rawBody = JSON.stringify(CLINIC_LIS_INBOUND_VENDOR_JSON_PAYLOAD);
    const rawBodyBuffer = Buffer.from(rawBody);
    const signature = computeClinicLisInboundWebhookSignature(
      CLINIC_LIS_INBOUND_WEBHOOK_SECRET,
      rawBodyBuffer,
    );

    await expect(
      queueService.enqueueInboundMessage({
        businessId: 'biz-1',
        rawBody,
        rawBodyBuffer,
        signature,
        contentType: 'application/octet-stream',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('processes HL7 pending messages end-to-end', async () => {
    savedMessage = {
      ...savedMessage,
      source: 'hl7',
      rawPayload: CLINIC_LIS_INBOUND_HL7_PAYLOAD,
    };

    await workerService.processMessage('msg-1');

    expect(savedMessage.status).toBe('Completed');
    expect(
      observationService.ingestAdaptedObservationRequest,
    ).toHaveBeenCalled();
  });

  it('triggers batch processing from enqueue event handler', async () => {
    messageRepo.find.mockResolvedValueOnce([]);
    await workerService.onInboundEnqueued();
    expect(messageRepo.find).toHaveBeenCalled();
  });

  it('documents inbound webhook headers', () => {
    expect(ClinicLabSyncInboundQueueService.inboundHeadersHelp()).toEqual({
      signatureHeader: 'x-clinic-lis-signature',
      deliveryIdHeader: 'x-clinic-lis-delivery-id',
    });
  });

  it('processes pending batches', async () => {
    messageRepo.find.mockResolvedValueOnce([savedMessage]);
    const count = await workerService.processPendingBatch();
    expect(count).toBe(1);
  });
});
