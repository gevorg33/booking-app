import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleConfigureBusinessTaxLogic,
  handleConfigureStackedTaxRulesLogic,
  handleExplainBusinessTaxLogic,
  handleExplainCheckoutTaxLogic,
  handleExplainConsumerCheckoutTaxLogic,
  handleExplainStackedTaxLogic,
  handleExplainStripeTaxChargeLogic,
  handleExplainAppointmentTaxLogic,
  handleLookupBookingTaxMetadataLogic,
  handleQuoteStaffBookingTaxLogic,
  handleSetServiceTaxRateLogic,
  handleSummarizeCustomerTaxPaidLogic,
  type BusinessTaxLogicDeps,
} from './ai-business-tax.logic.js';

@Injectable()
export class AiBusinessTaxService {
  private readonly deps: BusinessTaxLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
  ) {
    this.deps = { businessRepo, serviceRepo, bookingRepo };
  }

  handleConfigureBusinessTax(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureBusinessTaxLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleSetServiceTaxRate(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleSetServiceTaxRateLogic(
      this.deps,
      businessId,
      params,
      prompt,
      confirmed,
    );
  }

  handleExplainBusinessTax(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainBusinessTaxLogic(this.deps, businessId, params, prompt);
  }

  handleExplainCheckoutTax(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainCheckoutTaxLogic(this.deps, businessId, params, prompt);
  }

  handleExplainConsumerCheckoutTax(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainConsumerCheckoutTaxLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfigureStackedTaxRules(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureStackedTaxRulesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainStackedTax(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainStackedTaxLogic(this.deps, businessId, params, prompt);
  }

  handleExplainStripeTaxCharge(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainStripeTaxChargeLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleLookupBookingTaxMetadata(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleLookupBookingTaxMetadataLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainAppointmentTax(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    sessionEmployeeId?: string,
  ): Promise<CommandResult> {
    return handleExplainAppointmentTaxLogic(
      this.deps,
      businessId,
      params,
      prompt,
      sessionEmployeeId,
    );
  }

  handleQuoteStaffBookingTax(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleQuoteStaffBookingTaxLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleSummarizeCustomerTaxPaid(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleSummarizeCustomerTaxPaidLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
