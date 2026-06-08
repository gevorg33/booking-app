import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleListReviewsLogic,
  handleSubmitReviewLogic,
  type ReviewsLogicDeps,
} from './ai-reviews.logic.js';

@Injectable()
export class AiReviewsService {
  private readonly deps: ReviewsLogicDeps;

  constructor(
    reviewsService: ReviewsService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
  ) {
    this.deps = { reviewsService, businessRepo, employeeRepo };
  }

  async handleListReviews(
    businessId: string,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleListReviewsLogic(this.deps, businessId, params);
  }

  async handleSubmitReview(
    businessId: string,
    slug: string | undefined,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    return handleSubmitReviewLogic(this.deps, businessId, slug, params);
  }
}
