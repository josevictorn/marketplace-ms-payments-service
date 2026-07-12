import { Injectable, Logger } from '@nestjs/common';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { PaymentResultMessage } from './payment-result.interface';

@Injectable()
export class PaymentResultPublisherService {
  private readonly logger = new Logger(PaymentResultPublisherService.name);
  private readonly EXCHANGE_NAME = 'payments';
  private readonly ROUTING_KEY = 'payment.result';

  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async publishPaymentResult(message: PaymentResultMessage): Promise<void> {
    try {
      const paymentMessage: PaymentResultMessage = {
        orderId: message.orderId,
        status: message.status,
        transactionId: message.transactionId,
        rejectionReason: message.rejectionReason,
        processedAt: message.processedAt,
      };

      await this.rabbitmqService.publishMessage(
        this.EXCHANGE_NAME,
        this.ROUTING_KEY,
        paymentMessage,
      );
      this.logger.log(
        `Successfully published payment result for orderId: ${message.orderId} with status: ${message.status}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish payment result for orderId: ${message.orderId}`,
        error,
      );
      throw error;
    }
  }
}
