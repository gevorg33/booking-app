import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  buildClinicLabBookingRequestAccountUrl,
  buildClinicLabBookingRequestBookUrl,
  buildClinicOrderBookingMetadata,
  buildClinicStaffOrderLinkMetadata,
  canPushClinicLabBookingRequest,
  canStaffBookCollectionForOrder,
  generateClinicLabBookingRequestToken,
  isClinicLabBookingRequestPending,
  type ClinicLabBookingRequestView,
  type ClinicLabOrderBookingActionView,
} from '../../../common/utils/clinic-lab-booking-request.util.js';
import { BookingService } from '../../booking/booking.service.js';
import {
  collectLinkedCollectionServiceIds,
  mergeCollectionServiceCandidateIds,
} from '../../../common/utils/clinic-lab-collection-service.util.js';
import { isClinicLabTestService } from '../../../common/utils/clinic-service.util.js';
import {
  Booking,
  BookingStatus,
} from '../../booking/entities/booking.entity.js';
import { Business } from '../../business/entities/business.entity.js';
import { Service } from '../../service/entities/service.entity.js';
import { NotificationsService } from '../../notifications/notifications.service.js';
import { ClinicTaskAutoService } from '../../clinic-tasks/clinic-task-auto.service.js';
import { ClinicTestOrder } from '../entities/clinic-test-order.entity.js';
import { ClinicTestOrderStatusHistory } from '../entities/clinic-test-order-status-history.entity.js';
import { ClinicLabPhiService } from '../shared/clinic-lab-phi.service.js';
import {
  assertClinicLabFeaturesEnabled,
  readBusinessTypeFromSettings,
} from '../shared/clinic-test-results-gate.util.js';

@Injectable()
export class ClinicTestOrderBookingRequestService {
  constructor(
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(ClinicTestOrderStatusHistory)
    private readonly orderHistoryRepo: Repository<ClinicTestOrderStatusHistory>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    private readonly clinicLabPhiService: ClinicLabPhiService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly bookingService: BookingService,
    @Optional() private readonly clinicTaskAutoService?: ClinicTaskAutoService,
  ) {}

  private async assertClinicBusiness(businessId: string): Promise<Business> {
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException('Business not found');
    assertClinicLabFeaturesEnabled(
      readBusinessTypeFromSettings(
        business.settings as Record<string, unknown> | undefined,
      ),
    );
    return business;
  }

  private async resolveSupportedCollectionServicesForOrder(
    businessId: string,
    order: ClinicTestOrder,
  ): Promise<Array<{ id: string; name: string }>> {
    const orderWithItems = await this.orderRepo.findOne({
      where: { id: order.id, businessId },
      relations: {
        items: {
          testType: true,
          testPanel: { items: { testType: true } },
        },
      },
    });

    const linkedServiceIds = collectLinkedCollectionServiceIds(
      orderWithItems?.items ?? [],
    );
    const candidateIds = mergeCollectionServiceCandidateIds(
      linkedServiceIds,
      order.collectionServiceId,
    );
    if (candidateIds.length === 0) return [];

    const services = await this.serviceRepo.find({
      where: { businessId, id: In(candidateIds), isActive: true },
      order: { name: 'ASC' },
    });

    return services
      .filter((service) => isClinicLabTestService(service.metadata))
      .map((service) => ({ id: service.id, name: service.name }));
  }

  private async assertSupportedCollectionService(
    businessId: string,
    order: ClinicTestOrder,
    collectionServiceId: string,
  ): Promise<Service> {
    const supportedCollectionServices =
      await this.resolveSupportedCollectionServicesForOrder(businessId, order);
    if (
      !supportedCollectionServices.some(
        (service) => service.id === collectionServiceId,
      )
    ) {
      throw new BadRequestException(
        'Collection service is not supported for this lab order',
      );
    }

    const collectionService = await this.serviceRepo.findOne({
      where: { id: collectionServiceId, businessId, isActive: true },
    });
    if (
      !collectionService ||
      !isClinicLabTestService(collectionService.metadata)
    ) {
      throw new BadRequestException(
        'Collection service must be an active lab_test service',
      );
    }

    return collectionService;
  }

  async getOrderBookingActions(
    businessId: string,
    orderId: string,
  ): Promise<ClinicLabOrderBookingActionView> {
    await this.assertClinicBusiness(businessId);
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Lab order not found');

    const supportedCollectionServices =
      await this.resolveSupportedCollectionServicesForOrder(businessId, order);

    return {
      orderId: order.id,
      displayNames: order.displayNames ?? null,
      status: order.status,
      customerId: order.customerId ?? null,
      bookingId: order.bookingId ?? null,
      collectionBookingId: order.collectionBookingId ?? null,
      collectionServiceId: order.collectionServiceId ?? null,
      bookingRequestPushedAt: order.bookingRequestPushedAt
        ? order.bookingRequestPushedAt.toISOString()
        : null,
      canPush:
        canPushClinicLabBookingRequest(order) &&
        supportedCollectionServices.length > 0,
      canStaffBook:
        canStaffBookCollectionForOrder(order) &&
        supportedCollectionServices.length > 0,
      supportedCollectionServices,
    };
  }

  async bookCollectionForOrder(
    businessId: string,
    orderId: string,
    collectionServiceId: string,
    employeeId: string,
    startTime: string,
    actorEmployeeId: string | null,
    actorUserId: string,
  ): Promise<ClinicLabOrderBookingActionView> {
    const business = await this.assertClinicBusiness(businessId);
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Lab order not found');

    if (!canStaffBookCollectionForOrder(order)) {
      throw new BadRequestException(
        'This lab order cannot have a staff-booked collection appointment',
      );
    }

    const collectionService = await this.assertSupportedCollectionService(
      businessId,
      order,
      collectionServiceId,
    );

    const booking = await this.bookingService.create(
      businessId,
      {
        employeeId,
        serviceId: collectionServiceId,
        customerId: order.customerId,
        startTime,
        metadata: buildClinicStaffOrderLinkMetadata(order.id),
      },
      actorUserId,
    );

    await this.orderRepo.save({
      id: order.id,
      collectionBookingId: booking.id,
      collectionServiceId: order.collectionServiceId ?? collectionServiceId,
    });

    const historyNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        'Staff booked lab collection appointment',
      );
    await this.orderHistoryRepo.save(
      this.orderHistoryRepo.create({
        orderId: order.id,
        status: order.status,
        previousStatus: order.status,
        employeeId: actorEmployeeId,
        note: historyNote ?? null,
      }),
    );

    try {
      await this.clinicTaskAutoService?.resolveLabBookingRequestCallbackTask(
        businessId,
        order.id,
      );
    } catch {
      // Auto-task resolution is best-effort and must not block staff booking.
    }

    return this.getOrderBookingActions(businessId, orderId);
  }

  async pushBookingRequestToPatient(
    businessId: string,
    orderId: string,
    collectionServiceId: string,
    employeeId: string | null,
  ): Promise<ClinicLabOrderBookingActionView> {
    const business = await this.assertClinicBusiness(businessId);
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Lab order not found');

    if (!canPushClinicLabBookingRequest(order)) {
      throw new BadRequestException(
        'This lab order cannot be pushed to the patient',
      );
    }

    const collectionService = await this.assertSupportedCollectionService(
      businessId,
      order,
      collectionServiceId,
    );

    const token =
      order.bookingRequestToken ?? generateClinicLabBookingRequestToken();
    const pushedAt = new Date();

    await this.orderRepo.save({
      id: order.id,
      collectionServiceId,
      bookingRequestToken: token,
      bookingRequestPushedAt: pushedAt,
      bookingRequestPushedByEmployeeId: employeeId,
    });

    const historyNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        `Booking request pushed for ${collectionService.name}`,
      );
    await this.orderHistoryRepo.save(
      this.orderHistoryRepo.create({
        orderId: order.id,
        status: order.status,
        previousStatus: order.status,
        employeeId,
        note: historyNote ?? null,
      }),
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';
    const bookUrl = buildClinicLabBookingRequestBookUrl(
      frontendUrl,
      business.slug,
      collectionServiceId,
      token,
    );
    const accountUrl = buildClinicLabBookingRequestAccountUrl(
      frontendUrl,
      business.slug,
    );

    await this.notificationsService.sendClinicLabBookingRequest({
      orderId: order.id,
      businessId,
      customerId: order.customerId,
      testNames: order.displayNames,
      collectionServiceName: collectionService.name,
      collectionServiceId,
      clinicOrderToken: token,
      bookUrl,
      accountUrl,
    });

    return this.getOrderBookingActions(businessId, orderId);
  }

  async listPendingBookingRequestsForCustomer(
    businessId: string,
    customerId: string,
  ): Promise<ClinicLabBookingRequestView[]> {
    await this.assertClinicBusiness(businessId);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return [];

    const orders = await this.orderRepo.find({
      where: {
        businessId,
        customerId,
        status: In(['NotCollected', 'Collecting', 'AwaitingResults']),
      },
      order: { bookingRequestPushedAt: 'DESC' },
    });

    const serviceIds = [
      ...new Set(
        orders
          .map((order) => order.collectionServiceId)
          .filter((id): id is string => !!id),
      ),
    ];
    const services =
      serviceIds.length > 0
        ? await this.serviceRepo.find({ where: { id: In(serviceIds) } })
        : [];
    const serviceNameById = new Map(services.map((s) => [s.id, s.name]));
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';

    return orders
      .filter((order) => isClinicLabBookingRequestPending(order))
      .filter((order) => order.bookingRequestToken && order.collectionServiceId)
      .map((order) => ({
        orderId: order.id,
        displayNames: order.displayNames ?? null,
        collectionServiceId: order.collectionServiceId!,
        collectionServiceName:
          serviceNameById.get(order.collectionServiceId!) ?? 'Lab collection',
        token: order.bookingRequestToken!,
        pushedAt: order.bookingRequestPushedAt!.toISOString(),
        collectionBookingId: order.collectionBookingId ?? null,
        bookUrl: buildClinicLabBookingRequestBookUrl(
          frontendUrl,
          business.slug,
          order.collectionServiceId!,
          order.bookingRequestToken!,
        ),
      }));
  }

  async resolveBookingRequestByToken(
    businessId: string,
    token: string,
    customerId?: string,
  ): Promise<ClinicLabBookingRequestView | null> {
    await this.assertClinicBusiness(businessId);
    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) return null;

    const order = await this.orderRepo.findOne({
      where: { businessId, bookingRequestToken: token },
    });
    if (!order || !isClinicLabBookingRequestPending(order)) return null;
    if (customerId && order.customerId !== customerId) return null;
    if (!order.collectionServiceId || !order.bookingRequestToken) return null;

    const service = await this.serviceRepo.findOne({
      where: { id: order.collectionServiceId },
    });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? '';

    return {
      orderId: order.id,
      displayNames: order.displayNames ?? null,
      collectionServiceId: order.collectionServiceId,
      collectionServiceName: service?.name ?? 'Lab collection',
      token: order.bookingRequestToken,
      pushedAt: order.bookingRequestPushedAt!.toISOString(),
      collectionBookingId: order.collectionBookingId ?? null,
      bookUrl: buildClinicLabBookingRequestBookUrl(
        frontendUrl,
        business.slug,
        order.collectionServiceId,
        order.bookingRequestToken,
      ),
    };
  }

  async fulfillBookingRequestForBooking(bookingId: string): Promise<void> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: { service: true },
    });
    if (!booking?.customerId || booking.status !== BookingStatus.CONFIRMED)
      return;

    const metadata = (booking.metadata ?? {}) as Record<string, unknown>;
    const token =
      typeof metadata.clinicOrderToken === 'string'
        ? metadata.clinicOrderToken.trim()
        : '';
    if (!token) return;

    const order = await this.orderRepo.findOne({
      where: {
        businessId: booking.businessId,
        bookingRequestToken: token,
        customerId: booking.customerId,
      },
    });
    if (!order || !isClinicLabBookingRequestPending(order)) return;

    if (
      order.collectionServiceId &&
      booking.serviceId !== order.collectionServiceId
    ) {
      return;
    }

    const business = await this.businessRepo.findOne({
      where: { id: booking.businessId },
    });
    if (!business) return;

    await this.orderRepo.save({
      id: order.id,
      collectionBookingId: booking.id,
    });

    const historyNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        'Patient booked lab collection appointment',
      );
    await this.orderHistoryRepo.save(
      this.orderHistoryRepo.create({
        orderId: order.id,
        status: order.status,
        previousStatus: order.status,
        employeeId: booking.employeeId ?? null,
        note: historyNote ?? null,
      }),
    );

    try {
      await this.clinicTaskAutoService?.resolveLabBookingRequestCallbackTask(
        booking.businessId,
        order.id,
      );
    } catch {
      // Auto-task resolution is best-effort and must not block booking fulfillment.
    }
  }

  buildCheckoutMetadataForToken(token: string): Record<string, unknown> {
    return buildClinicOrderBookingMetadata(token);
  }
}
