import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  clinicLabTestOffersPreVisitIntake,
  isClinicLabTestService,
} from '../../common/utils/clinic-public-pre-visit-intake.util.js';
import { readBusinessTypeFromSettings } from '../clinic-test-results/shared/clinic-test-results-gate.util.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import { BusinessService } from '../business/business.service.js';
import { Service } from '../service/entities/service.entity.js';
import { ClinicPreVisitIntakeService } from '../clinic-pre-visit-intakes/clinic-pre-visit-intake.service.js';
import type { SubmitClinicPreVisitIntakeAnswersDto } from '../clinic-pre-visit-intakes/dto/clinic-pre-visit-intake.dto.js';
import type { PublicPreVisitIntakeDraftDto } from './dto/public-pre-visit-intake.dto.js';

@Injectable()
export class PublicPreVisitIntakeService {
  constructor(
    private readonly businessService: BusinessService,
    private readonly intakeService: ClinicPreVisitIntakeService,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  private async resolveBusiness(slug: string) {
    const business = await this.businessService.findBySlug(slug);
    if (!business.isActive) {
      throw new BadRequestException('This business is not accepting bookings');
    }
    return business;
  }

  async hasPublishedIntakeQuestionnaire(businessId: string): Promise<boolean> {
    if (!(await this.isClinicVerticalBusiness(businessId))) {
      return false;
    }
    return this.intakeService.hasPublishedIntakeQuestionnaire(businessId);
  }

  async getCheckoutConfig(slug: string, serviceId: string) {
    const business = await this.resolveBusiness(slug);
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId: business.id, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const hasQuestionnaire = await this.hasPublishedIntakeQuestionnaire(
      business.id,
    );
    const offersPreVisitIntake = clinicLabTestOffersPreVisitIntake(
      service.metadata,
      hasQuestionnaire,
    );

    if (!offersPreVisitIntake) {
      return {
        offersPreVisitIntake: false,
        questionnaire: null,
      };
    }

    const questionnaire =
      await this.intakeService.getDefaultIntakeQuestionnairePreview(
        business.id,
      );

    return {
      offersPreVisitIntake: true,
      questionnaire,
    };
  }

  async ensureCustomerDraft(
    slug: string,
    customerId: string,
    dto: PublicPreVisitIntakeDraftDto,
  ) {
    const business = await this.resolveBusiness(slug);
    await this.assertLabTestService(business.id, dto.serviceId);
    return this.intakeService.assignDraftForPublicCustomer(
      business.id,
      customerId,
      dto.questionnaireId,
    );
  }

  async getCustomerFlow(slug: string, customerId: string, intakeId: string) {
    const business = await this.resolveBusiness(slug);
    return this.intakeService.getIntakeFlowForPublicCustomer(
      business.id,
      customerId,
      intakeId,
    );
  }

  async startCustomerIntake(
    slug: string,
    customerId: string,
    intakeId: string,
  ) {
    const business = await this.resolveBusiness(slug);
    return this.intakeService.startIntakeForPublicCustomer(
      business.id,
      customerId,
      intakeId,
    );
  }

  async submitCustomerAnswers(
    slug: string,
    customerId: string,
    intakeId: string,
    dto: SubmitClinicPreVisitIntakeAnswersDto,
  ) {
    const business = await this.resolveBusiness(slug);
    return this.intakeService.submitAnswersForPublicCustomer(
      business.id,
      customerId,
      intakeId,
      dto,
    );
  }

  async linkIntakeToBooking(
    businessId: string,
    customerId: string,
    intakeId: string,
    bookingId: string,
  ) {
    return this.intakeService.linkIntakeToBooking(
      businessId,
      customerId,
      intakeId,
      bookingId,
    );
  }

  serviceOffersPreVisitIntake(
    metadata: Record<string, unknown> | null | undefined,
    hasQuestionnaire: boolean,
  ): boolean {
    return clinicLabTestOffersPreVisitIntake(metadata, hasQuestionnaire);
  }

  private async assertLabTestService(businessId: string, serviceId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, businessId, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (!isClinicLabTestService(service.metadata)) {
      throw new BadRequestException(
        'Pre-visit intake is only available for lab test bookings',
      );
    }
    const hasQuestionnaire =
      await this.hasPublishedIntakeQuestionnaire(businessId);
    if (!hasQuestionnaire) {
      throw new BadRequestException(
        'No published intake questionnaire is configured for this clinic',
      );
    }
  }

  private async isClinicVerticalBusiness(businessId: string) {
    const business = await this.businessService.findOne(businessId);
    return isClinicVerticalBusinessType(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
  }
}
