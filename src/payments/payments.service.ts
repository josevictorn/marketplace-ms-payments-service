import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { FakePaymentGatewayService } from './fake-payment-gateway.service';
import { PaymentOrderMessage } from '../events/payments-queue.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly fakePaymentGatewayService: FakePaymentGatewayService,
  ) {}

  async processPayment(message: PaymentOrderMessage): Promise<Payment> {
    const { orderId, userId, amount, paymentMethod } = message;

    // Check if a payment for this orderId already exists to ensure idempotency
    let payment = await this.paymentRepository.findOneBy({ orderId });

    if (payment && payment.status !== PaymentStatus.PENDING) {
      this.logger.warn(
        `Payment for orderId ${orderId} has already been processed.`,
      );
      return payment;
    }

    if (!payment) {
      // 1. Create a Payment record with status 'pending'
      payment = this.paymentRepository.create({
        orderId,
        userId,
        amount,
        paymentMethod,
        status: PaymentStatus.PENDING,
      });
      await this.paymentRepository.save(payment);
    }

    try {
      // 2. Call the FakePaymentGatewayService
      const gatewayResult = await this.fakePaymentGatewayService.processPayment(
        amount,
        paymentMethod,
      );

      // 3. Update the Payment record based on the result
      payment.status = gatewayResult.approved
        ? PaymentStatus.APPROVED
        : PaymentStatus.REJECTED;
      payment.transactionId = gatewayResult.transactionId;
      payment.processedAt = new Date();
      if (!gatewayResult.approved) {
        payment.rejectionReason = gatewayResult.rejectionReason || null;
      }

      // 4. Save the updated record
      await this.paymentRepository.save(payment);

      // 5. Log the processing result
      this.logger.log(
        `Payment processing finished: orderId=${orderId}, status=${payment.status}, transactionId=${payment.transactionId}`,
      );

      return payment;
    } catch (error) {
      this.logger.error(
        `Error processing payment for orderId ${orderId}`,
        error,
      );
      throw error; // Let the consumer handle retry / NACK
    }
  }

  async findByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOneBy({ orderId });
    if (!payment) {
      throw new NotFoundException(`Payment not found for orderId: ${orderId}`);
    }
    return payment;
  }
}
