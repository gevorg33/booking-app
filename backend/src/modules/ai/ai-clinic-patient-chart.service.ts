import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { PatientChartService } from '../patient-clinical-profiles/patient-chart.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainPatientChartLogic,
  type ClinicPatientChartLogicDeps,
} from './ai-clinic-patient-chart.logic.js';

@Injectable()
export class AiClinicPatientChartService {
  private readonly deps: ClinicPatientChartLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    patientChartService: PatientChartService,
  ) {
    this.deps = {
      businessRepo,
      customerRepo,
      patientChartService,
    };
  }

  handleExplainPatientChart(
    businessId: string,
    userId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainPatientChartLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }
}
