import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  canTransitionClinicTestOrder,
  type ClinicTestOrderStatus,
} from '../../../common/utils/clinic-lab-state.util.js';
import { BusinessService } from '../../business/business.service.js';
import { ClinicTestOrder } from '../entities/clinic-test-order.entity.js';
import { ClinicTestOrderStatusHistory } from '../entities/clinic-test-order-status-history.entity.js';
import { ClinicLabPhiService } from '../shared/clinic-lab-phi.service.js';
import { ClinicTestResultService } from '../test-result/clinic-test-result.service.js';

export interface TransitionClinicTestOrderInput {
  businessId: string;
  orderId: string;
  toStatus: ClinicTestOrderStatus;
  employeeId?: string | null;
  note?: string | null;
}

@Injectable()
export class ClinicTestOrderStatusService {
  constructor(
    @InjectRepository(ClinicTestOrder)
    private readonly orderRepo: Repository<ClinicTestOrder>,
    @InjectRepository(ClinicTestOrderStatusHistory)
    private readonly historyRepo: Repository<ClinicTestOrderStatusHistory>,
    private readonly businessService: BusinessService,
    private readonly clinicLabPhiService: ClinicLabPhiService,
    private readonly clinicTestResultService: ClinicTestResultService,
  ) {}

  async transitionOrderStatus(
    input: TransitionClinicTestOrderInput,
  ): Promise<ClinicTestOrder> {
    const order = await this.orderRepo.findOne({
      where: { id: input.orderId, businessId: input.businessId },
    });
    if (!order) {
      throw new NotFoundException('Clinic test order not found');
    }

    const fromStatus = order.status;
    if (fromStatus === input.toStatus) {
      return order;
    }

    if (!canTransitionClinicTestOrder(fromStatus, input.toStatus)) {
      throw new BadRequestException(
        `Invalid clinic test order transition: ${fromStatus} → ${input.toStatus}`,
      );
    }

    order.status = input.toStatus;
    if (input.toStatus === 'Cancelled') {
      order.cancelledAt = new Date();
    }

    await this.orderRepo.save(order);

    if (input.toStatus === 'AwaitingResults') {
      await this.clinicTestResultService.ensureResultForOrder(order.id);
    }

    const business = await this.businessService.findOne(input.businessId);
    const encryptedNote =
      await this.clinicLabPhiService.encryptStatusHistoryNoteForStorage(
        business,
        input.note,
      );

    await this.historyRepo.save(
      this.historyRepo.create({
        orderId: order.id,
        status: input.toStatus,
        previousStatus: fromStatus,
        employeeId: input.employeeId ?? null,
        note: encryptedNote ?? null,
      }),
    );

    return order;
  }
}
