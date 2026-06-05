import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessService } from '../business/business.service.js';
import { Business } from '../business/entities/business.entity.js';
import { ComplianceController } from './compliance.controller.js';
import { ComplianceBreachService } from './compliance-breach.service.js';
import { PhiAccessAuditService } from './phi-access-audit.service.js';
import { PhiFieldService } from './phi-field.service.js';
import { DataBreachIncident } from './entities/data-breach-incident.entity.js';
import { PhiAccessAuditLog } from './entities/phi-access-audit-log.entity.js';

describe('ComplianceModule wiring', () => {
  it('constructs controller and compliance services via Nest DI', async () => {
    const module = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        ComplianceBreachService,
        PhiAccessAuditService,
        PhiFieldService,
        {
          provide: getRepositoryToken(DataBreachIncident),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(PhiAccessAuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Business),
          useValue: { save: jest.fn() },
        },
        {
          provide: BusinessService,
          useValue: {
            ensureOwner: jest.fn(),
            ensureMember: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    expect(module.get(ComplianceController)).toBeInstanceOf(
      ComplianceController,
    );
    expect(module.get(ComplianceBreachService)).toBeInstanceOf(
      ComplianceBreachService,
    );
    expect(module.get(PhiAccessAuditService)).toBeInstanceOf(
      PhiAccessAuditService,
    );
    expect(module.get(PhiFieldService)).toBeInstanceOf(PhiFieldService);
  });
});
