import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleExplainProviderSpecialtyLogic,
  type ProviderSpecialtyLogicDeps,
} from './ai-explain-provider-specialty.logic.js';
import {
  handleExplainAnyProviderOptionLogic,
  type AnyProviderOptionLogicDeps,
} from './ai-explain-any-provider-option.logic.js';
import {
  handlePickProviderForServiceLogic,
  type PickProviderForServiceLogicDeps,
} from './ai-pick-provider-for-service.logic.js';
import {
  handleSwitchProviderSameTimeLogic,
  type SwitchProviderSameTimeLogicDeps,
} from './ai-switch-provider-same-time.logic.js';
import {
  handleExplainProfessionalProfileLogic,
  type ExplainProfessionalProfileLogicDeps,
} from './ai-explain-professional-profile.logic.js';
import {
  handleListProviderReviewsLogic,
  type ListProviderReviewsLogicDeps,
} from './ai-list-provider-reviews.logic.js';
import { handleSubmitProviderReviewLogic } from './ai-submit-provider-review.logic.js';
import { handleSubmitReviewWithTokenLogic } from './ai-submit-review-with-token.logic.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';

@Injectable()
export class AiProviderSpecialtyService {
  private readonly deps: ProviderSpecialtyLogicDeps;
  private readonly anyProviderOptionDeps: AnyProviderOptionLogicDeps;
  private readonly pickProviderDeps: PickProviderForServiceLogicDeps;
  private readonly switchProviderSameTimeDeps: SwitchProviderSameTimeLogicDeps;
  private readonly professionalProfileDeps: ExplainProfessionalProfileLogicDeps;

  constructor(
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    private readonly reviewsService: ReviewsService,
    private readonly publicCustomerAuthService: PublicCustomerAuthService,
    private readonly publicBookingService: PublicBookingService,
  ) {
    this.deps = {
      employeeRepo,
      serviceRepo,
      reviewsService: this.reviewsService,
    };
    this.anyProviderOptionDeps = { employeeRepo };
    this.pickProviderDeps = {
      employeeRepo,
      serviceRepo,
      publicCustomerAuthService: this.publicCustomerAuthService,
    };
    this.switchProviderSameTimeDeps = {
      employeeRepo,
      serviceRepo,
      publicBookingService: this.publicBookingService,
    };
    this.professionalProfileDeps = {
      employeeRepo,
      serviceRepo,
      reviewsService: this.reviewsService,
    };
  }

  handleExplainProviderSpecialty(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleExplainProviderSpecialtyLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainAnyProviderOption(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleExplainAnyProviderOptionLogic(
      this.anyProviderOptionDeps,
      businessId,
      params,
      prompt,
    );
  }

  handlePickProviderForService(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handlePickProviderForServiceLogic(
      this.pickProviderDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleSwitchProviderSameTime(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleSwitchProviderSameTimeLogic(
      this.switchProviderSameTimeDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainProfessionalProfile(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
  ): Promise<CommandResult> {
    return handleExplainProfessionalProfileLogic(
      this.professionalProfileDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleListProviderReviews(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleListProviderReviewsLogic(
      {
        employeeRepo: this.deps.employeeRepo,
        serviceRepo: this.deps.serviceRepo,
        reviewsService: this.reviewsService,
      },
      businessId,
      params,
    );
  }

  handleSubmitProviderReview(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleSubmitProviderReviewLogic(
      {
        employeeRepo: this.deps.employeeRepo,
        reviewsService: this.reviewsService,
      },
      businessId,
      params,
    );
  }

  handleSubmitReviewWithToken(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleSubmitReviewWithTokenLogic(
      { reviewsService: this.reviewsService },
      businessId,
      params,
    );
  }
}
